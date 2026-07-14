import type { MessageSegment } from "./types"

function normalizeLang(raw: string): string {
  const map: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    cpp: "c++",
    "c++": "c++",
    cs: "c#",
    rb: "ruby",
    kt: "kotlin",
    rs: "rust",
    go: "go",
    java: "java",
    swift: "swift",
  }
  return map[raw.toLowerCase()] ?? raw.toLowerCase()
}

function transformOutsideCodeFences(
  text: string,
  transform: (value: string) => string,
): string {
  return text
    .split(/(```[^\n`]*\n?[\s\S]*?```)/g)
    .map((part) => part.startsWith("```") ? part : transform(part))
    .join("")
}

function plainLatex(inner: string): string {
  let plain = inner
  plain = plain.replace(/\\cdot/g, "*")
  plain = plain.replace(/\\times/g, "×")
  plain = plain.replace(/\\leq/g, "<=")
  plain = plain.replace(/\\geq/g, ">=")
  plain = plain.replace(/\\neq/g, "!=")
  plain = plain.replace(/\\infty/g, "∞")
  plain = plain.replace(/\\text(?:bf|it|rm)?\{([^}]*)}/, "$1")
  plain = plain.replace(/\\(log|min|max|sum|sqrt|sin|cos|tan|ln)\b/g, "$1")
  plain = plain.replace(/\^\{([^}]*)}/, "^($1)")
  plain = plain.replace(/_\{([^}]*)}/, "_($1)")
  plain = plain.replace(/\\frac\{([^}]*)}\{([^}]*)}/, "($1 / $2)")
  plain = plain.replace(/\\(?:left|right)[.()[\]|]/g, "")
  plain = plain.replace(/\\_/g, "_")
  plain = plain.replace(/\\[a-zA-Z]+/g, "")
  return plain
}

export function sanitizeModelText(raw: string): string {
  let text = raw

  // Keep code fences untouched while cleaning model prose.
  text = transformOutsideCodeFences(text, (value) =>
    value
      .replace(/\$([^$\n]+)\$/g, (_match, inner: string) => plainLatex(inner))
      .replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner: string) => plainLatex(inner))
      .replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner: string) => plainLatex(inner))
      .replace(/\bO\(([^()\n]*\\[a-zA-Z][^()\n]*)\)/g, (_match, inner: string) => `O(${plainLatex(inner)})`)
      .replace(/\$/g, "")
      .replace(/^#{1,6}\s+(?=\S)/gm, ""),
  )

  text = transformOutsideCodeFences(text, (value) =>
    value.replace(/(?<![\w`])'+([^'\n]+)'+(?![\w`])/g, "$1"),
  )

  text = transformOutsideCodeFences(text, (value) =>
    value.replace(/\*{3,}/g, "**"),
  )

  return text
}

export function parseResponse(raw: string): MessageSegment[] {
  const cleaned = sanitizeModelText(raw)
  const segments: MessageSegment[] = []
  const parts = cleaned.split(/(```[^\n`]*\n?[\s\S]*?```)/g)

  for (const part of parts) {
    if (!part.trim()) continue

    const fenceMatch = part.match(/^```([^\n`]*)\n?([\s\S]*?)```$/)
    if (fenceMatch) {
      const lang = normalizeLang(fenceMatch[1].trim())
      const code = fenceMatch[2].trim()
      if (code) {
        segments.push({ type: "code", content: code, language: lang })
      }
    } else {
      const lines = part.trim().split("\n")
      let textBuffer: string[] = []

      const flushText = () => {
        const text = textBuffer.join("\n").trim()
        if (text) segments.push({ type: "text", content: text })
        textBuffer = []
      }

      for (const line of lines) {
        if (looksLikeCode(line)) {
          flushText()
          segments.push({ type: "code", content: line.trim() })
        } else {
          textBuffer.push(line)
        }
      }
      flushText()
    }
  }

  return segments.length > 0
    ? segments
    : [{ type: "text", content: cleaned.trim() }]
}

function looksLikeCode(line: string): boolean {
  const value = line.trim()
  if (!value || value.startsWith("- ") || value.startsWith("* ")) return false

  return (
    /^[a-zA-Z_$][\w$]*(?:\[[^\]]+\]|\.[a-zA-Z_$][\w$]*)+\s*(?:=|\+=|-=|\+\+|--)/.test(value) ||
    /^(?:if|while)\s*\(.+\)\s*\{?$/.test(value) ||
    /^(?:return|yield)\s+[^.!?]+;?$/.test(value) ||
    /^(?:const|let|var|int|long|double|float|bool|string|auto)\s+[a-zA-Z_$][\w$]*\s*=/.test(value)
  )
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function applyInlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>")
}
