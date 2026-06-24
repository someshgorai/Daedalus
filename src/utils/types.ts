export interface Settings {
  apiKey: string
  selectedModel: string
}

export interface ORModel {
  id: string
  name: string
  contextLength?: number
  isFree?: boolean
}

export interface LCContext {
  question: string
  questionTitle: string
  code: string
  language: string
  extractedAt: number
}

export interface Intuition {
  summary: string
  keyInsight: string
  whyItWorks: string
}

export interface Method {
  name: string
  category: string
  steps: string[]
}

export interface Concept {
  name: string
  description: string
  icon: string
}

export interface Complexity {
  time: string
  timeExplanation: string
  space: string
  spaceExplanation: string
  optimal: boolean
  optimalNote: string
}

export interface CodeStyle {
  readability: number
  efficiency: number
  structure: number
  bestPractices: number
  overallScore: number
  strengths: string[]
  improvements: string[]
}

export interface Approach {
  name: string
  time: string
  space: string
  feasible: boolean
}

export interface Analysis {
  intuition: Intuition
  method: Method
  concepts: Concept[]
  complexity: Complexity
  codeStyle: CodeStyle
  comparison: { approaches: Approach[] }
  verdict: string
}

export interface ChatMsg {
  id: string
  role: "user" | "assistant"
  content: string
  segments: MessageSegment[]
  timestamp: number
}

export interface MessageSegment {
  type: "text" | "code"
  content: string
  language?: string
  note?: string
}

export interface CodeSnippet {
  code: string
  language: string
  note: string
}

export type ValidationReason = "empty" | "too_short" | "placeholder" | "syntax_error"

export interface ValidationResult {
  valid: boolean
  reason?: ValidationReason
  message?: string
}

export interface AnalyzeRequest {
  context: LCContext
}

export interface AnalyzeResponse {
  data?: Analysis
  error?: string
}

export interface ChatRequest {
  context: LCContext
  history: ChatMsg[]
  message: string
}

export interface ChatResponse {
  reply?: string
  error?: string
}

export interface ModelsRequest {
  apiKey: string
}

export interface ModelsResponse {
  models?: ORModel[]
  error?: string
}

export type AnalysisStatus = "idle" | "loading" | "success" | "error"
export type ActiveTab = "analyze" | "chat" | "settings"
