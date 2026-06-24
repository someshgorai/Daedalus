import {
  OR_BASE_URL,
  OR_APP_NAME,
  OR_APP_URL,
  ANALYZE_MAX_TOKENS,
  CHAT_MAX_TOKENS,
  TEMPERATURE_ANALYZE,
  TEMPERATURE_CHAT,
} from "./constants"
import type { Analysis, ChatMsg, LCContext, ORModel } from "./types"

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
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const res = await fetch(`${OR_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: makeHeaders(apiKey),
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
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
  // Models sometimes add a JSON fence even when asked not to.
  const stripped = raw
    .replace(/^```[a-z]*\n?/im, "")
    .replace(/```\s*$/im, "")
    .trim()

  try {
    return JSON.parse(stripped) as T
  } catch {
    // Recover a JSON object when the response includes surrounding text.
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error(
      "Could not parse model response as JSON. Try a different model.",
    )
  }
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function asScore(value: unknown): number {
  const score = typeof value === "number" && Number.isFinite(value) ? value : 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {}
}

function normalizeAnalysis(value: unknown): Analysis {
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
    codeStyle: {
      readability: asScore(codeStyle.readability),
      efficiency: asScore(codeStyle.efficiency),
      structure: asScore(codeStyle.structure),
      bestPractices: asScore(codeStyle.bestPractices),
      overallScore: asScore(codeStyle.overallScore),
      strengths: asList(codeStyle.strengths),
      improvements: asList(codeStyle.improvements),
    },
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
      isFree: true,
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
    "readability": 85,
    "efficiency": 90,
    "structure": 80,
    "bestPractices": 88,
    "overallScore": 86,
    "strengths": ["strength"],
    "improvements": ["improvement"]
  },
  "comparison": {
    "approaches": [
      { "name": "Brute Force", "time": "O(n^2)", "space": "O(1)", "feasible": false },
      { "name": "Current",     "time": "O(n)",   "space": "O(n)", "feasible": true  },
      { "name": "Optimal",     "time": "O(n)",   "space": "O(1)", "feasible": true  }
    ]
  },
  "verdict": "One powerful sentence summarizing this solution's quality."
}`

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

  return normalizeAnalysis(parseJSON<unknown>(raw))
}

function buildChatSystem(ctx: LCContext): string {
  return `You are a strict LeetCode mentor. Your ONLY job is to guide thinking — never to solve.

ABSOLUTE RULES — breaking ANY of these is a failure:
1. Never write a complete function, class, or algorithm
2. Never produce more than 3 lines of code total in any response
3. Code must be PARTIAL — showing a direction, not a solution
   GOOD: nums[i] = nums[i-1] + arr[i]   (prefix sum direction)
   BAD:  for(int i=1;i<n;i++) prefix[i] = prefix[i-1] + nums[i];
4. Total response must be under 80 words
5. If the user asks for the full solution, reply EXACTLY:
   "I can only give hints. The thinking has to come from you! Try: [one-line direction]"
6. Separate code from text — mark code with triple backticks so the UI renders it properly
7. Never use markdown headers (#, ##) in your response
8. Be direct and crisp — no filler words

Context:
Problem: ${ctx.questionTitle}
Language: ${ctx.language}
Current Code:
\`\`\`${ctx.language.toLowerCase()}
${ctx.code.slice(0, 1500)}
\`\`\``
}

export async function chatCompletion(
  apiKey: string,
  model: string,
  ctx: LCContext,
  history: ChatMsg[],
  userMessage: string,
): Promise<string> {
  if (/\b(?:full|complete|entire|working|copy[- ]?paste)\s+(?:solution|code|answer|function|algorithm)\b/i.test(userMessage) ||
      /\b(?:give|show|write|send)\s+me\s+(?:the\s+)?solution\b/i.test(userMessage)) {
    return "I can only give hints. The thinking has to come from you! Try: identify the invariant your loop must preserve."
  }

  const messages = [
    { role: "system", content: buildChatSystem(ctx) },
    // Recent turns are enough context and keep requests predictable.
    ...history.slice(-6).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ]

  const reply = await post(apiKey, model, messages, CHAT_MAX_TOKENS, TEMPERATURE_CHAT)
  return enforceMentorResponse(reply)
}

function enforceMentorResponse(raw: string): string {
  const withoutHeaders = raw.replace(/^#{1,6}\s*/gm, "").trim()
  const codeBlocks = [...withoutHeaders.matchAll(/```([^\n`]*)\n?([\s\S]*?)```/g)]

  if (codeBlocks.some((match) => match[2].trim().split("\n").length > 3) ||
      /\b(?:class|function)\s+\w+[\s\S]*\{[\s\S]*\}/i.test(withoutHeaders)) {
    return "I can only give hints. The thinking has to come from you! Try: isolate the state that changes at each step."
  }

  const words = withoutHeaders.split(/\s+/)
  if (words.length <= 80) return withoutHeaders
  return `${words.slice(0, 80).join(" ")}…`
}
