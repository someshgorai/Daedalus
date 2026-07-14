import { useEffect, useState } from "react"
import { useModels } from "~/hooks/useModels"
import { useSettings } from "~/hooks/useSettings"

export function useApiKeyForm() {
  const {
    apiKey,
    selectedModel,
    ready,
    isKeyValid,
    saveApiKey,
    saveModel,
  } = useSettings()

  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    refresh,
  } = useModels()

  const [keyInput, setKeyInput] = useState("")
  const [keyError, setKeyError] = useState("")
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    if (ready && apiKey) setKeyInput(apiKey)
  }, [ready, apiKey])

  // Keep the model dropdown fresh once a valid key is available.
  useEffect(() => {
    if (apiKey && isKeyValid) refresh(apiKey)
  }, [apiKey, isKeyValid, refresh])

  const handleSave = async () => {
    const key = keyInput.trim()

    if (!key) {
      setKeyError("API key cannot be empty")
      return
    }

    if (!key.startsWith("sk-or-")) {
      setKeyError("Must start with sk-or-…")
      return
    }

    setKeyError("")
    await saveApiKey(key)
    setSavedFeedback(true)
    refresh(key)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  const handleKeyInputChange = (value: string) => {
    setKeyInput(value)
    setKeyError("")
  }

  return {
    apiKey,
    selectedModel,
    ready,
    isKeyValid,
    saveModel,

    keyInput,
    keyError,
    savedFeedback,
    handleSave,
    handleKeyInputChange,

    models,
    modelsLoading,
    modelsError,
    refreshModels: refresh,
  }
}
