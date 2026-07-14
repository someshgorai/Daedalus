import { useState, useCallback } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { validateCode } from "~/utils/validator"
import type {
  Analysis,
  AnalysisStatus,
  AnalyzeRequest,
  AnalyzeResponse,
  LCContext,
  ValidationResult,
} from "~/utils/types"

export function useAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] =
    useState<ValidationResult | null>(null)

  const analyze = useCallback(async (context: LCContext) => {
    // Block empty stubs before the model has a chance to hallucinate analysis.
    const validation = validateCode(context.code)
    if (!validation.valid) {
      setValidationError(validation)
      setResult(null)
      setError(null)
      setStatus("idle")
      return
    }

    setValidationError(null)
    setStatus("loading")
    setError(null)

    try {
      const res = await sendToBackground<AnalyzeRequest, AnalyzeResponse>({
        name: "analyze",
        body: { context },
      })

      if (res.error) throw new Error(res.error)
      if (!res.data) throw new Error("The analyzer returned no result.")
      setResult(res.data)
      setStatus("success")
    } catch (e) {
      setError((e as Error).message)
      setStatus("error")
    }
  }, [])

  return {
    status,
    result,
    error,
    validationError,
    analyze,
  }
}
