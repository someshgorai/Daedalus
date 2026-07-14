import { useState, useCallback } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { ModelsRequest, ModelsResponse, ORModel } from "~/utils/types"
import { CURATED_FREE_MODELS } from "~/utils/constants"

export function useModels() {
  const [models, setModels] = useState<ORModel[]>(CURATED_FREE_MODELS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (apiKey: string) => {
    if (!apiKey) return
    setLoading(true)
    setError(null)

    try {
      const res = await sendToBackground<ModelsRequest, ModelsResponse>({
        name: "models",
        body: { apiKey },
      })

      if (res.error) throw new Error(res.error)

      if (res.models && res.models.length > 0) {
        setModels(res.models)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    models,
    loading,
    error,
    refresh,
  }
}
