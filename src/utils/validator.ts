import {
  MIN_MEANINGFUL_LINES,
  PLACEHOLDER_PATTERNS,
} from "./constants"
import type { ValidationResult } from "./types"

// Blank and comment-only lines do not count as an implementation.
function meaningfulLines(code: string): string[] {
  return code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false
      if (l.startsWith("//")) return false
      if (l.startsWith("#")) return false
      if (l.startsWith("/*") || l === "*/") return false
      if (l.startsWith("*")) return false
      return true
    })
}

function isPlaceholder(code: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(code))
}

export function validateCode(
  code: string,
  _language: string,
): ValidationResult {
  const trimmed = code.trim()

  if (!trimmed) {
    return {
      valid: false,
      reason: "empty",
      message: "Your editor is empty. Write some code first, then analyze!",
    }
  }

  if (isPlaceholder(trimmed)) {
    return {
      valid: false,
      reason: "placeholder",
      message:
        "Looks like a placeholder. Start writing your approach — even a few lines help!",
    }
  }

  const lines = meaningfulLines(trimmed)
  if (lines.length < MIN_MEANINGFUL_LINES) {
    return {
      valid: false,
      reason: "too_short",
      message: `Only ${lines.length} meaningful line${lines.length === 1 ? "" : "s"} found. Add more before analyzing.`,
    }
  }

  return { valid: true }
}
