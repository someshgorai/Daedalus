import { useEffect, useState } from "react"
import { useModels } from "~/hooks/useModels"
import { useSettings } from "~/hooks/useSettings"
import { GlowBadge } from "../ui/GlowBadge"
import { ShimmerButton } from "../ui/ShimmerButton"

export function SettingsPanel() {
  const {
    apiKey,
    selectedModel,
    ready,
    isKeyValid,
    saveApiKey,
    saveModel,
  } = useSettings()
  const { models, loading: modelsLoading, refresh } = useModels()
  const [keyInput, setKeyInput] = useState("")
  const [keyError, setKeyError] = useState("")
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    if (ready && apiKey) setKeyInput(apiKey)
  }, [ready, apiKey])

  useEffect(() => {
    if (apiKey && isKeyValid) refresh(apiKey)
  }, [apiKey])

  const handleSave = async () => {
    const key = keyInput.trim()
    if (!key) return setKeyError("API key cannot be empty")
    if (!key.startsWith("sk-or-")) return setKeyError("Must start with sk-or-…")

    setKeyError("")
    await saveApiKey(key)
    setSavedFeedback(true)
    refresh(key)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  return (
    <div className="settings-panel">
      <header className="settings-header">
        <h2>Configuration</h2>
        <p>Set up your AI provider access</p>
      </header>

      <section>
        <label className="form-label">OpenRouter API Key</label>
        <div className="form-row">
          <input
            className="form-control form-control--key"
            type="password"
            value={keyInput}
            onChange={(event) => {
              setKeyInput(event.target.value)
              setKeyError("")
            }}
            onKeyDown={(event) => event.key === "Enter" && handleSave()}
            placeholder="sk-or-v1-…"
          />
          <ShimmerButton onClick={handleSave}>
            {savedFeedback ? "✓ Saved" : "Save"}
          </ShimmerButton>
        </div>
        {keyError && <p className="form-error">{keyError}</p>}
        <div className="form-status">
          <GlowBadge
            valid={isKeyValid}
            text={isKeyValid ? "API Key Valid" : "Key missing or invalid"}
          />
        </div>
        <a
          className="external-link"
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noreferrer"
        >
          → Get free key at openrouter.ai/keys
        </a>
      </section>

      <section>
        <div className="form-heading">
          <label className="form-label form-label--flush">
            Model Selection <span>(free only)</span>
          </label>
          <button
            className="text-button"
            onClick={() => apiKey && refresh(apiKey)}
            disabled={modelsLoading || !apiKey}
          >
            {modelsLoading ? "⟳ Loading…" : "↻ Refresh"}
          </button>
        </div>
        <select
          className="form-control form-control--select"
          value={selectedModel}
          onChange={(event) => saveModel(event.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
        <p className="selected-model">Selected: {selectedModel}</p>
      </section>
    </div>
  )
}
