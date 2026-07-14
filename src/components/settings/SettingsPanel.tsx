import { useApiKeyForm } from "~/hooks/useApiKeyForm"
import { GlowBadge } from "../ui/GlowBadge"
import { ShimmerButton } from "../ui/ShimmerButton"

export function SettingsPanel() {
  const {
    apiKey,
    selectedModel,
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
    refreshModels,
  } = useApiKeyForm()

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
            onChange={(event) => handleKeyInputChange(event.target.value)}
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
            onClick={() => apiKey && refreshModels(apiKey)}
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
        {modelsError && <p className="form-error">{modelsError}</p>}
        <p className="selected-model">Selected: {selectedModel}</p>
      </section>
    </div>
  )
}
