import type { ORModel } from "./types"

export const OR_BASE_URL = "https://openrouter.ai/api/v1"
export const OR_APP_NAME = "Daedalus"
export const OR_APP_URL = "https://github.com/daedalus"

export const DEFAULT_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"

export const ANALYZE_MAX_TOKENS = 2500
export const CHAT_MAX_TOKENS = 900
export const TEMPERATURE_ANALYZE = 0.3
export const TEMPERATURE_CHAT = 0.4

// Used before the live OpenRouter model list is available.
export const CURATED_FREE_MODELS: ORModel[] = [
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano 30B" },
  { id: "google/gemma-4-26b-a4b-it:free",      name: "Google Gemma 4 26B A4B" },
  { id: "google/gemma-4-31b-it:free",           name: "Google Gemma 4 31B" },
  { id: "openrouter/free",                      name: "OpenRouter Free Models Router" },
]

export const STORAGE_KEY_API_KEY = "apiKey"
export const STORAGE_KEY_MODEL   = "selectedModel"

export const MIN_MEANINGFUL_LINES = 3

export const MAX_QUESTION_CHARS = 3000
export const MAX_CODE_CHARS     = 8000

export const CHAT_CODE_PREVIEW_CHARS = 1500

export const MAX_CODE_BLOCK_LINES = 10

export const LONG_LINE_THRESHOLD = 110

export const READABILITY_BASELINE    = 72
export const EFFICIENCY_BASELINE     = 68
export const STRUCTURE_BASELINE      = 70
export const BEST_PRACTICES_BASELINE = 74

export const PLACEHOLDER_PATTERNS = [
  /\/\/\s*your code here/i,
  /\/\/\s*write your (code|solution) here/i,
  /\/\/\s*TODO/i,
  /\bTODO\b/i,
  /^\s*pass\s*$/m,
  /^\s*return null;\s*$/m,
  /^\s*return None\s*$/m,
  /^\s*\/\/\s*$/m,
  /your code goes here/i,
  /implement this/i,
]
