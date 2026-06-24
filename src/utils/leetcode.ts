import { MAX_QUESTION_CHARS, MAX_CODE_CHARS } from "./constants"
import type { LCContext } from "./types"

// Problem text

export function extractTitle(): string {
  const titleSelectors = [
    "div[data-cy='question-title']",
    ".text-title-large a",
    "div.flex.items-center.gap-4 a",
    "h4.mr-2",
  ]
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }
  return document.title
    .replace(/- LeetCode.*/i, "")
    .replace(/LeetCode\s*-\s*/i, "")
    .trim()
}

export function extractQuestion(): string {
  const selectors = [
    "[data-track-load='description_content']",
    ".elfjS",
    "[class*='description__']",
    ".content__u3I1",
    "div[class*='Description']",
    "div[class*='problem-description']",
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const text = el?.textContent?.trim()
    if (text && text.length > 50) {
      return text.slice(0, MAX_QUESTION_CHARS)
    }
  }
  return extractTitle()
}

// Editor state

export function extractCode(): string {
  // Monaco's textarea has the full value; rendered lines may be virtualized.
  const editorTextareas = Array.from(
    document.querySelectorAll<HTMLTextAreaElement>("textarea.inputarea"),
  )
  const activeTextarea =
    editorTextareas.find(
      (textarea) =>
        textarea.getAttribute("aria-label") === "Code editor" &&
        textarea.value.trim().length > 0,
    ) ??
    editorTextareas.find((textarea) => textarea.value.trim().length > 0)

  if (activeTextarea) {
    return activeTextarea.value.trim().slice(0, MAX_CODE_CHARS)
  }

  // Older editor versions may only expose rendered lines.
  const monacoEditors = Array.from(document.querySelectorAll(".monaco-editor"))
  for (const editor of monacoEditors) {
    const monacoLines = editor.querySelectorAll(".view-lines .view-line")
    if (monacoLines.length === 0) continue

    const code = Array.from(monacoLines)
      .map((l) => (l.textContent ?? "").replace(/\u00a0/g, " "))
      .join("\n")
      .trim()
    if (code.length > 0) return code.slice(0, MAX_CODE_CHARS)
  }

  const cm = document.querySelector(".CodeMirror-code")
  if (cm?.textContent) return cm.textContent.trim().slice(0, MAX_CODE_CHARS)

  // Ignore CodeMirror instances used for test cases.
  const cm6Editors = Array.from(
    document.querySelectorAll<HTMLElement>(".cm-editor .cm-content"),
  )
  const cm6Code = cm6Editors
    .map((editor) => editor.innerText.trim())
    .find((value) => /\b(class|function|def|fn|public|private|return)\b/.test(value))
  if (cm6Code) return cm6Code.slice(0, MAX_CODE_CHARS)

  const pre = document.querySelector("pre.CodeMirror-line, pre[class*='code']")
  if (pre?.textContent) return pre.textContent.trim().slice(0, MAX_CODE_CHARS)

  return ""
}

export function extractLanguage(): string {
  const selectors = [
    "[data-track-load='code_language_btn']",
    "button[id*='headlessui-listbox-button']",
    ".ant-select-selection-item",
    "div[class*='language'] button",
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const text = el?.textContent?.trim()
    if (text && text.length < 30) return text
  }

  // The current language picker has no stable ID, so use its visible value.
  const languageNames = new Set([
    "C", "C++", "C#", "Dart", "Elixir", "Erlang", "Go", "Java",
    "JavaScript", "Kotlin", "PHP", "Python", "Python3", "Racket",
    "Ruby", "Rust", "Scala", "Swift", "TypeScript",
  ])
  const languageButton = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button[aria-haspopup='dialog']"),
  ).find((button) => languageNames.has(button.textContent?.trim() ?? ""))
  if (languageButton?.textContent) return languageButton.textContent.trim()

  return "C++"
}

export function extractContext(): LCContext {
  return {
    question: extractQuestion(),
    questionTitle: extractTitle(),
    code: extractCode(),
    language: extractLanguage(),
    extractedAt: Date.now(),
  }
}

// Preserve the problem statement when only the editor has changed.
export function refreshCodeContext(existing: LCContext): LCContext {
  return {
    ...existing,
    code: extractCode(),
    language: extractLanguage(),
    extractedAt: Date.now(),
  }
}
