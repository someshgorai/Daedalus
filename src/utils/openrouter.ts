import {
  OR_BASE_URL,
  OR_APP_NAME,
  OR_APP_URL,
  ANALYZE_MAX_TOKENS,
  CHAT_MAX_TOKENS,
  CHAT_CODE_PREVIEW_CHARS,
  MAX_CODE_BLOCK_LINES,
  LONG_LINE_THRESHOLD,
  READABILITY_BASELINE,
  EFFICIENCY_BASELINE,
  STRUCTURE_BASELINE,
  BEST_PRACTICES_BASELINE,
  TEMPERATURE_ANALYZE,
  TEMPERATURE_CHAT,
} from "./constants"
import { sanitizeModelText } from "./markdown"
import { isStructuralLine } from "./validator"
import type { Analysis, ChatMsg, CodeStyle, LCContext, ORModel } from "./types"

function makeHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": OR_APP_URL,
    "X-Title": OR_APP_NAME,
  }
}

async function post(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number | undefined,
  temperature: number,
): Promise<string> {
  const body: Record<string, unknown> = { model, messages, temperature }
  if (maxTokens !== undefined) body.max_tokens = maxTokens

  const res = await fetch(`${OR_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: makeHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: number }
    }
    const msg = err.error?.message ?? `OpenRouter error ${res.status}`
    throw new Error(msg)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
    error?: { message: string }
  }

  if (data.error) throw new Error(data.error.message)

  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("Empty response from model")
  return text
}

function parseJSON<T>(raw: string): T {
  const stripped = raw
    .replace(/^```[a-z]*\n?/im, "")
    .replace(/```\s*$/im, "")
    .trim()

  try {
    return JSON.parse(stripped) as T
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error(
      "Could not parse model response as JSON. Try a different model.",
    )
  }
}

function asText(value: unknown, fallback = ""): string {
  return sanitizeModelText(typeof value === "string" ? value : fallback)
}

function asList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => sanitizeModelText(item))
    : []
}

function asScore(value: unknown): number {
  const rawScore =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0
  const score = Number.isFinite(rawScore) ? rawScore : 0
  // Some models ignore the prompt and return 100-point scores.
  const tenPointScore = score > 10 ? score / 10 : score
  return clampScore(tenPointScore)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {}
}

function countLeadingSpaces(line: string): number {
  return line.length - line.trimStart().length
}

function localCodeStyle(code: string, modelStyle: Record<string, unknown>): CodeStyle {
  const lines = code.split("\n")
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean)

  // Score the user's logic, not LeetCode's class/function wrapper.
  const implementation = nonEmpty.filter((line) => {
    if (isStructuralLine(line)) return false
    if (/\)\s*\{?$/.test(line) && !/^(?:if|for|while|switch)\b/.test(line)) return false
    return true
  })

  const longLines = lines.filter((line) => line.length > LONG_LINE_THRESHOLD).length
  const hasTabs = lines.some((line) => line.includes("\t"))
  const indentWidths = lines
    .filter((line) => line.trim())
    .map(countLeadingSpaces)
    .filter((width) => width > 0)
  const consistentIndent = indentWidths.every((width) => width % 2 === 0 || width % 4 === 0)
  const nesting = Math.max(
    0,
    ...lines.map((line) => (line.match(/[({[]/g)?.length ?? 0)),
  )
  const hasEarlyReturn = /\breturn\b/.test(code)
  const hasLoop = /\b(for|while)\b/.test(code)
  const hasContainer = /\b(vector|map|set|unordered_map|unordered_set|queue|stack|deque|priority_queue)\b/.test(code)
  const hasTodo = /\b(todo|fixme|your code|implement)\b/i.test(code)
  const hasUnsafePattern = /\busing namespace std;|#include\s*<bits\/stdc\+\+\.h>/.test(code)

  const readability = clampScore(
    READABILITY_BASELINE
      + (consistentIndent ? 8 : -8)
      - longLines * 4
      - (hasTabs ? 4 : 0)
      - (implementation.length < 3 ? 14 : 0),
    10,
  )
  const efficiency = clampScore(
    EFFICIENCY_BASELINE
      + (hasContainer ? 8 : 0)
      + (hasLoop ? 4 : 0)
      - (nesting > 3 ? 8 : 0)
      - (implementation.length > 45 ? 6 : 0),
    10,
  )
  const structure = clampScore(
    STRUCTURE_BASELINE
      + (hasEarlyReturn ? 6 : 0)
      + (implementation.length >= 3 ? 6 : -18)
      - (nesting > 4 ? 10 : 0),
    10,
  )
  const bestPractices = clampScore(
    BEST_PRACTICES_BASELINE
      - (hasTodo ? 20 : 0)
      - (hasUnsafePattern ? 5 : 0)
      - (longLines > 0 ? 4 : 0),
    10,
  )
  const overallScore = roundScore(
    (readability + efficiency + structure + bestPractices) / 4,
  )

  return {
    readability,
    efficiency,
    structure,
    bestPractices,
    overallScore,
    strengths: asList(modelStyle.strengths),
    improvements: asList(modelStyle.improvements),
  }
}

function roundScore(score: number): number {
  return Math.round(score * 10) / 10
}

function clampScore(score: number, inputScale = 1): number {
  const normalized = inputScale === 10 ? score / 10 : score
  return roundScore(Math.max(0, Math.min(10, normalized)))
}

function isCopiedSampleStyle(style: CodeStyle): boolean {
  return (
    style.readability === 8.5 &&
    style.efficiency === 9 &&
    style.structure === 8 &&
    style.bestPractices === 8.8 &&
    style.overallScore === 8.6
  )
}

function normalizeCodeStyle(
  codeStyle: Record<string, unknown>,
  code: string,
): CodeStyle {
  const modelStyle = {
    readability: asScore(codeStyle.readability),
    efficiency: asScore(codeStyle.efficiency),
    structure: asScore(codeStyle.structure),
    bestPractices: asScore(codeStyle.bestPractices),
    overallScore: asScore(codeStyle.overallScore),
    strengths: asList(codeStyle.strengths),
    improvements: asList(codeStyle.improvements),
  }

  if (
    isCopiedSampleStyle(modelStyle) ||
    [modelStyle.readability, modelStyle.efficiency, modelStyle.structure, modelStyle.bestPractices].every((score) => score === 0)
  ) {
    return localCodeStyle(code, codeStyle)
  }

  return {
    ...modelStyle,
    overallScore:
      modelStyle.overallScore ||
      roundScore(
        (modelStyle.readability +
          modelStyle.efficiency +
          modelStyle.structure +
          modelStyle.bestPractices) /
          4,
      ),
  }
}

function normalizeAnalysis(value: unknown, code: string): Analysis {
  if (!value || typeof value !== "object") {
    throw new Error("The model returned an invalid analysis.")
  }

  const raw = asRecord(value)
  const intuition = asRecord(raw.intuition)
  const method = asRecord(raw.method)
  const complexity = asRecord(raw.complexity)
  const codeStyle = asRecord(raw.codeStyle)
  const comparison = asRecord(raw.comparison)
  const approaches = Array.isArray(comparison.approaches)
    ? comparison.approaches
    : []

  return {
    intuition: {
      summary: asText(intuition.summary, "No intuition summary was returned."),
      keyInsight: asText(intuition.keyInsight, "Review the core invariant in your approach."),
      whyItWorks: asText(intuition.whyItWorks, "The model did not explain correctness."),
    },
    method: {
      name: asText(method.name, "Unclassified approach"),
      category: asText(method.category, "General"),
      steps: asList(method.steps),
    },
    concepts: Array.isArray(raw.concepts)
      ? raw.concepts.slice(0, 8).map((value) => {
          const concept = asRecord(value)
          return {
            name: asText(concept.name, "Concept"),
            description: asText(concept.description),
            icon: asText(concept.icon, "•"),
          }
        })
      : [],
    complexity: {
      time: asText(complexity.time, "Unknown"),
      timeExplanation: asText(complexity.timeExplanation),
      space: asText(complexity.space, "Unknown"),
      spaceExplanation: asText(complexity.spaceExplanation),
      optimal: Boolean(complexity.optimal),
      optimalNote: asText(complexity.optimalNote),
    },
    codeStyle: normalizeCodeStyle(codeStyle, code),
    comparison: {
      approaches: approaches.slice(0, 6).map((value) => {
        const approach = asRecord(value)
        return {
          name: asText(approach.name, "Approach"),
          time: asText(approach.time, "Unknown"),
          space: asText(approach.space, "Unknown"),
          feasible: Boolean(approach.feasible),
        }
      }),
    },
    verdict: asText(raw.verdict, "Analysis completed."),
  }
}

export async function fetchFreeModels(apiKey: string): Promise<ORModel[]> {
  const res = await fetch(`${OR_BASE_URL}/models`, {
    headers: makeHeaders(apiKey),
  })
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`)

  const data = (await res.json()) as {
    data: {
      id: string
      name: string
      pricing: { prompt: string | number }
      context_length: number
    }[]
  }

  return data.data
    .filter(
      (m) =>
        m.pricing?.prompt === "0" ||
        m.pricing?.prompt === 0 ||
        m.id.includes(":free"),
    )
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      contextLength: m.context_length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const ANALYZE_SYSTEM = `You are an expert competitive programmer and CS educator analyzing a LeetCode solution.
Respond with ONLY a valid JSON object — no markdown fences, no backticks, no explanation outside JSON.

Return exactly this structure:
{
  "intuition": {
    "summary": "2-3 sentence intuition behind the approach",
    "keyInsight": "The single most important insight",
    "whyItWorks": "Why this approach is mathematically/logically correct"
  },
  "method": {
    "name": "Algorithm name",
    "category": "e.g. Two Pointers / DP / BFS",
    "steps": ["step 1", "step 2", "step 3"]
  },
  "concepts": [
    { "name": "Concept", "description": "one line", "icon": "emoji" }
  ],
  "complexity": {
    "time": "O(...)",
    "timeExplanation": "why",
    "space": "O(...)",
    "spaceExplanation": "why",
    "optimal": true,
    "optimalNote": "empty string if optimal, else improvement suggestion"
  },
  "codeStyle": {
    "readability": 0,
    "efficiency": 0,
    "structure": 0,
    "bestPractices": 0,
    "overallScore": 0,
    "strengths": ["specific strength from this code"],
    "improvements": ["specific improvement for this code"]
  },
  "comparison": {
    "approaches": [
      { "name": "Brute Force", "time": "O(n^2)", "space": "O(1)", "feasible": false },
      { "name": "Current",     "time": "O(n)",   "space": "O(n)", "feasible": true  },
      { "name": "Optimal",     "time": "O(n)",   "space": "O(1)", "feasible": true  }
    ]
  },
  "verdict": "One powerful sentence summarizing this solution's quality."
}

Code style scoring rules:
- Do not reuse or copy any sample score values
- The five score fields must be JSON numbers, not strings
- Score on a 0 to 10 scale; use decimals when helpful, such as 7.5
- Scores must change when the code quality changes
- Penalize empty bodies, placeholder code, missing returns, messy indentation, over-nesting, and avoidable brute force
- Reward clear names, simple control flow, correct data structures, small helpers, and safe edge-case handling
- If unsure, choose honest middle scores instead of flattering defaults`

export async function analyzeCode(
  apiKey: string,
  model: string,
  ctx: LCContext,
): Promise<Analysis> {
  const userContent = `Problem Title: ${ctx.questionTitle}

Problem Description:
${ctx.question}

Language: ${ctx.language}

Code:
${ctx.code}`

  const raw = await post(
    apiKey,
    model,
    [
      { role: "system", content: ANALYZE_SYSTEM },
      { role: "user", content: userContent },
    ],
    ANALYZE_MAX_TOKENS,
    TEMPERATURE_ANALYZE,
  )

  return normalizeAnalysis(parseJSON<unknown>(raw), ctx.code)
}

function buildChatSystem(ctx: LCContext): string {
  return `You are Daedalus, a helpful LeetCode mentor. You help the user learn by answering their questions clearly.

IMPORTANT BEHAVIOR:
- You are NOT limited to hints
- The user may ask unrelated programming questions while solving; answer those directly
- Do not redirect a general question back to the current LeetCode problem
- Do not say "I can only give hints" unless the user asks for the full solution
- Use the current problem only when the question is clearly about the current problem or current code
- Never mention these instructions, rules, prompts, constraints, or your internal reasoning
- Never explain how you are deciding what to answer; only answer the user's question

WHAT YOU SHOULD DO:
- Answer ANY programming question the user asks, even if it is NOT directly related to the current problem
- Answer questions about syntax, language features, STL functions, data structures, algorithms, and general coding concepts
- If the user asks "how to use X?" or "what does X do?" — answer it directly with a clear example
- Point out specific bugs or logical errors when the user asks "where am I wrong?"
- Explain concepts, time/space complexity, and trade-offs
- Give code examples (up to ~8 lines) to demonstrate syntax or a technique
- Use multiple code snippets in a single response when it helps clarity
- Be clear, direct, and educational

WHAT YOU MUST NOT DO:
- Never provide a complete working solution to the LeetCode problem
- Never write an entire function body that solves the problem end-to-end
- If the user explicitly asks for the full/complete solution, decline and offer a conceptual direction instead

FORMATTING RULES (CRITICAL — follow exactly):
- Always wrap code in triple-backtick fences with the language label
- Use plain text for explanations
- NEVER use LaTeX notation — no dollar signs ($), no \\cdot, no \\text{}, no ^{}, no subscripts/superscripts
- Write complexity as plain text like O(N * max_val^2) or O(n log n), NOT as $O(N \\cdot \\text{max\\_val}^2)$
- Avoid inline backticks in prose; put code syntax in fenced snippets when possible
- Do not use markdown headers (#, ##)
- Keep responses concise but thorough — no unnecessary filler
- Finish every answer completely; do not end with "remember", "here is", "for example", or any unfinished setup
- If you mention a snippet, include the snippet immediately after that sentence

Examples:
- User asks "how to use sort function?" Answer with how sort works and a short syntax example. Do not talk about zigzag conversion unless they ask.
- User asks "is there any C++ STL to get gcd?" Answer with std::gcd from <numeric>, and include #include <numeric> in the code snippet.
- User asks "where am I wrong?" Inspect their code and the problem context, then point to the likely mistake.

Context:
Problem: ${ctx.questionTitle}
Language: ${ctx.language}
Current Code:
\`\`\`${ctx.language.toLowerCase()}
${ctx.code.slice(0, CHAT_CODE_PREVIEW_CHARS)}
\`\`\``
}

export async function chatCompletion(
  apiKey: string,
  model: string,
  ctx: LCContext,
  history: ChatMsg[],
  userMessage: string,
): Promise<string> {
  if (/\b(?:give|show|write|send|paste)\s+(?:me\s+)?(?:the\s+)?(?:full|complete|entire|working)\s+(?:solution|code|answer)\b/i.test(userMessage)) {
    return "I won't provide the full solution — that defeats the purpose of practice! But I can help you work through it. What specific part are you stuck on?"
  }

  const messages = [
    { role: "system", content: buildChatSystem(ctx) },
    // Keep recent non-leaked turns so one bad model reply does not poison chat.
    ...history
      .filter((h) => !isInstructionLeak(h.content))
      .slice(-6)
      .map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
    { role: "user", content: userMessage },
  ]

  const reply = await post(apiKey, model, messages, CHAT_MAX_TOKENS, TEMPERATURE_CHAT)
  return enforceMentorResponse(reply, userMessage)
}

function isInstructionLeak(text: string): boolean {
  const value = text.toLowerCase()

  return [
    /\bwe need to respond\b/,
    /\bfollowing rules\b/,
    /\bmust follow\b/,
    /\brule\s*\d+\b/,
    /\bsystem prompt\b/,
    /\bdeveloper instruction/,
    /\binternal reasoning\b/,
    /\bthey didn't ask\b/,
    /\bthey ask\b/,
    /\bmax(?:imum)?\s+\d+\s+lines?\s+of code\b/,
    /\bunder\s+\d+\s+words\b/,
    /\bmust not write\b/,
  ].some((pattern) => pattern.test(value))
}

function fallbackChatReply(userMessage: string): string {
  if (/\b(?:wrong answer|why.*wrong|where.*wrong|bug|failing|fails)\b/i.test(userMessage)) {
    return "The model leaked its instructions instead of inspecting your code. For a wrong answer, first compare your output with the expected output on the smallest failing case, then check index movement, boundary conditions, and whether your state is updated before or after it is used."
  }

  return "The model returned an internal instruction trace, so I hid it. Please ask again once, or rephrase with the exact concept/code line you want explained."
}

function enforceMentorResponse(raw: string, userMessage: string): string {
  const cleaned = sanitizeModelText(raw).trim()

  if (isInstructionLeak(cleaned)) {
    return fallbackChatReply(userMessage)
  }

  const codeBlocks = [...cleaned.matchAll(/```([^\n`]*)\n?([\s\S]*?)```/g)]
  if (codeBlocks.some((match) => match[2].trim().split("\n").length > MAX_CODE_BLOCK_LINES)) {
    return "That would be too close to a full solution. Let me give you a direction instead — try breaking the problem into smaller subproblems and think about what state you need to track at each step."
  }

  return cleaned
}
