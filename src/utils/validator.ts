import {
  MIN_MEANINGFUL_LINES,
  PLACEHOLDER_PATTERNS,
} from "./constants"
import type { ValidationReason, ValidationResult } from "./types"

// Treat wrapper lines as boilerplate so empty LeetCode stubs do not pass validation.
export function isStructuralLine(line: string): boolean {
  return (
    /^[{};]+$/.test(line) ||
    /^(?:public|private|protected):$/.test(line) ||
    /^(?:class|struct|interface)\s+\w+/.test(line) ||
    /^template\s*</.test(line) ||
    /^(?:async\s+)?def\s+\w+\s*\(/.test(line) ||
    /^(?:async\s+)?function\s*\w*\s*\(/.test(line) ||
    /^(?:[\w:<>,*&[\]\s]+\s+)+[\w:~]+\s*\([^;]*\)\s*(?:const\s*)?(?:noexcept\s*)?(?:override\s*)?\{?$/.test(line)
  )
}

function implementationLines(code: string): string[] {
  return code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false
      if (l.startsWith("//")) return false
      if (l.startsWith("#")) return false
      if (l.startsWith("/*") || l === "*/") return false
      if (l.startsWith("*")) return false
      if (isStructuralLine(l)) return false
      return true
    })
}

function isPlaceholder(code: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(code))
}

function invalid(reason: ValidationReason, message: string): ValidationResult {
  return { valid: false, reason, message }
}

export function validateCode(code: string): ValidationResult {
  const trimmed = code.trim()

  if (!trimmed) {
    return invalid(
      "empty",
      "Your editor is empty. Write some code first, then analyze!",
    )
  }

  if (isPlaceholder(trimmed)) {
    return invalid(
      "placeholder",
      "Looks like a placeholder. Start writing your approach — even a few lines help!",
    )
  }

  const lines = implementationLines(trimmed)
  if (lines.length === 0) {
    return invalid(
      "no_implementation",
      "Your solution body is empty. Add your actual logic before analyzing.",
    )
  }

  if (lines.length < MIN_MEANINGFUL_LINES) {
    return invalid(
      "too_short",
      `Only ${lines.length} meaningful line${lines.length === 1 ? "" : "s"} found. Add more before analyzing.`,
    )
  }

  return { valid: true }
}
