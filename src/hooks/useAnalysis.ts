import { useState, useCallback } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { validateCode } from "~/utils/validator"
import type {
  Analysis,
  AnalysisStatus,
  AnalyzeRequest,
  AnalyzeResponse,
  LCContext,
  ValidationResult
} from "~/utils/types"


export function useAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<ValidationResult | null>(null)

  const analyze = useCallback(async (context: LCContext) => {
    // Validate before hitting the API
    const validation = validateCode(context.code, context.language)
    if (!validation.valid) {
      setValidationError(validation)
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

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setValidationError(null)
  }, [])

  return {
    status,
    result,
    error,
    validationError,
    analyze,
    reset,
    isLoading: status === "loading",
    isSuccess: status === "success",
  }
}
