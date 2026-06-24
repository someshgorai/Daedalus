// Extension popup for API key and model settings.

import { useEffect, useState } from "react"
import { GlowBadge } from "./components/ui/GlowBadge"
import { LightRays } from "./components/ui/LightRays"
import { ShimmerButton } from "./components/ui/ShimmerButton"
import { useModels } from "~/hooks/useModels"
import { useSettings } from "~/hooks/useSettings"
import "~/styles.css"

export default function Popup() {
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
  const [isLeetCode, setIsLeetCode] = useState(false)

  useEffect(() => {
    if (ready && apiKey) setKeyInput(apiKey)
  }, [ready, apiKey])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      setIsLeetCode(Boolean(tab?.url?.includes("leetcode.com/problems/")))
    })
  }, [])

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
                onChange={(event) => {
                  setKeyInput(event.target.value)
                  setKeyError("")
                }}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                placeholder="sk-or-v1-…"
              />
              <ShimmerButton className="shimmer-button--compact" onClick={handleSave}>
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
                onClick={() => apiKey && refresh(apiKey)}
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
