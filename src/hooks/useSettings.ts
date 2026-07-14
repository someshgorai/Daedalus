import { useState, useEffect, useCallback } from "react"
import { Storage } from "@plasmohq/storage"
import {
  DEFAULT_MODEL,
  STORAGE_KEY_API_KEY,
  STORAGE_KEY_MODEL,
} from "~/utils/constants"

const storage = new Storage()

export function useSettings() {
  const [apiKey, setApiKeyState] = useState("")
  const [selectedModel, setModelState] = useState(DEFAULT_MODEL)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const [key, model] = await Promise.all([
          storage.get<string>(STORAGE_KEY_API_KEY),
          storage.get<string>(STORAGE_KEY_MODEL),
        ])

        if (cancelled) return
        if (key) setApiKeyState(key)
        if (model) setModelState(model)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const saveApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim()
    await storage.set(STORAGE_KEY_API_KEY, trimmed)
    setApiKeyState(trimmed)
  }, [])

  const saveModel = useCallback(async (model: string) => {
    await storage.set(STORAGE_KEY_MODEL, model)
    setModelState(model)
  }, [])

  const isKeyValid = apiKey.startsWith("sk-or-")

  return {
    apiKey,
    selectedModel,
    ready,
    isKeyValid,
    saveApiKey,
    saveModel,
  }
}
