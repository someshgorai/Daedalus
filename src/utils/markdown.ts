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

// Split model output so snippets are rendered separately from prose.
export function parseResponse(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  // The label pattern also handles names such as c++ and objective-c.
  const parts = raw.split(/(```[^\n`]*\n?[\s\S]*?```)/g)

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
      // Some models omit fences around short expressions.
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
    : [{ type: "text", content: raw.trim() }]
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
