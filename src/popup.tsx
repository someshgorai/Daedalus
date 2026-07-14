import { useEffect, useState } from "react"
import { LightRays } from "./components/ui/LightRays"
import { GlowBadge } from "./components/ui/GlowBadge"
import { ShimmerButton } from "./components/ui/ShimmerButton"
import { useApiKeyForm } from "~/hooks/useApiKeyForm"
import "~/styles.css"

export default function Popup() {
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

  const [isLeetCode, setIsLeetCode] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      setIsLeetCode(Boolean(tab?.url?.includes("leetcode.com/problems/")))
    })
  }, [])

  const handleOpenPanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const host = document.getElementById("daedalus-host")
        const button = host?.shadowRoot?.querySelector(
          "[title='Daedalus']",
        ) as HTMLElement
        button?.click()
      },
    })
    window.close()
  }

  return (
    <div className="popup">
      <LightRays>
        <div className="popup__content">
          <header className="popup-header">
            <div className="popup-header__icon">⚡</div>
            <h1>Daedalus</h1>
          </header>

          <section className="popup-card">
            <label className="form-label">API Configuration</label>
            <div className="form-row form-row--spaced">
              <input
                className="form-control form-control--popup"
                type="password"
                value={keyInput}
                onChange={(event) => handleKeyInputChange(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                placeholder="sk-or-v1-…"
              />
              <ShimmerButton
                className="shimmer-button--compact"
                onClick={handleSave}
              >
                {savedFeedback ? "✓" : "Save"}
              </ShimmerButton>
            </div>
            {keyError && <p className="form-error form-error--popup">{keyError}</p>}
            <div className="popup-card__footer">
              <GlowBadge
                valid={isKeyValid}
                text={isKeyValid ? "API key valid" : "Missing API key"}
              />
              <a
                className="external-link"
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
              >
                Get free key ↗
              </a>
            </div>
          </section>

          <section className="popup-card">
            <div className="form-heading form-heading--popup">
              <label className="form-label form-label--flush">
                Model <span>(free only)</span>
              </label>
              <button
                className="text-button"
                onClick={() => apiKey && refreshModels(apiKey)}
                disabled={modelsLoading || !apiKey}
              >
                {modelsLoading ? "⟳ loading…" : "↻ refresh"}
              </button>
            </div>
            <select
              className="form-control form-control--popup"
              value={selectedModel}
              onChange={(event) => saveModel(event.target.value)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            {modelsError && (
              <p className="form-error form-error--popup">{modelsError}</p>
            )}
          </section>

          <div className="popup-action">
            {isLeetCode && isKeyValid ? (
              <ShimmerButton
                className="shimmer-button--primary-action"
                onClick={handleOpenPanel}
                fullWidth
              >
                ⚡ Open Analyzer
              </ShimmerButton>
            ) : (
              <div className="popup-warning">
                {!isKeyValid
                  ? "⚠ Configure API key to start"
                  : "⚠ Navigate to a LeetCode problem first"}
              </div>
            )}
          </div>
        </div>
      </LightRays>
    </div>
  )
}
