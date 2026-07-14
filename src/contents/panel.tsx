import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"
import cssText from "data-text:~/styles.css"
import {
  ComparisonCard,
  ComplexityCard,
  ConceptsCard,
  IntuitionCard,
  MethodCard,
  VerdictBanner,
} from "~/components/analysis/AnalysisCards"
import { CodeStyleCard } from "~/components/analysis/CodeStyleCard"
import { ChatInput, ChatPanel } from "~/components/chat/ChatPanel"
import { SettingsPanel } from "~/components/settings/SettingsPanel"
import { AnimatedTabs } from "~/components/ui/AnimatedTabs"
import { FloatingButton } from "~/components/ui/FloatingButton"
import { LightRays } from "~/components/ui/LightRays"
import { ShimmerButton } from "~/components/ui/ShimmerButton"
import { useAnalysis } from "~/hooks/useAnalysis"
import { useChat } from "~/hooks/useChat"
import { useLeetCode } from "~/hooks/useLeetCode"
import type { ActiveTab } from "~/utils/types"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
}

export const getShadowHostId = () => "daedalus-host"

// Plasmo uses a shadow root, so styles need to be injected manually.
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export default function Panel() {
  const [visible, setVisible] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("analyze")
  const { context, loaded, isRescanning, rescanCode } = useLeetCode()
  const { status, result, error, validationError, analyze } = useAnalysis()
  const {
    messages,
    loading: chatLoading,
    error: chatError,
    send,
    bottomRef,
  } = useChat(context)

  const handleAnalyze = async () => {
    const latestContext = await rescanCode()
    await analyze(latestContext)
  }

  const handleChatSend = async (message: string) => {
    const latestContext = await rescanCode()
    await send(message, latestContext)
  }

  // The popup dispatches this event when the user clicks "Open Analyzer".
  useEffect(() => {
    const togglePanel = () => setVisible((current) => !current)
    window.addEventListener("daedalus-toggle-panel", togglePanel)
    return () => window.removeEventListener("daedalus-toggle-panel", togglePanel)
  }, [])

  return (
    <div className="daedalus-root">
      <FloatingButton
        onClick={() => setVisible((current) => !current)}
        open={visible}
      />

      {visible && (
        <aside className={`sidebar ${minimized ? "sidebar--minimized" : ""}`}>
          <LightRays />
          <header className="sidebar-header">
            <div className="sidebar-heading">
              <strong>⚡ Daedalus</strong>
              {context && (
                <span className="sidebar-problem">{context.questionTitle}</span>
              )}
            </div>
            <div className="sidebar-actions">
              <button
                className="icon-button"
                onClick={() => setMinimized((current) => !current)}
                aria-label={minimized ? "Restore sidebar" : "Minimize sidebar"}
              >
                {minimized ? "□" : "—"}
              </button>
              <button
                className="icon-button icon-button--close"
                onClick={() => setVisible(false)}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>
          </header>

          {!minimized && (
            <>
              <AnimatedTabs<ActiveTab>
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: "analyze", label: "🔍 Analyze" },
                  { id: "chat", label: "💬 Chat" },
                  { id: "settings", label: "⚙ Settings" },
                ]}
              />

              <main className="sidebar-content">
                {activeTab === "analyze" && (
                  <div className="tab-panel tab-panel--scroll">
                    <div className="analyze-actions">
                      <ShimmerButton
                        fullWidth
                        onClick={handleAnalyze}
                        disabled={status === "loading" || isRescanning || !loaded}
                      >
                        {status === "loading"
                          ? "Analyzing…"
                          : isRescanning
                            ? "Scanning editor…"
                            : "⚡ Analyze Solution"}
                      </ShimmerButton>
                      <button
                        className="rescan-button"
                        onClick={rescanCode}
                        disabled={isRescanning}
                        title="Re-read code from editor"
                        aria-label="Rescan editor"
                      >
                        <span className={isRescanning ? "is-spinning" : ""}>⟳</span>
                      </button>
                    </div>

                    {validationError && (
                      <div className="notice notice--warning">
                        ⚠ {validationError.message}
                      </div>
                    )}

                    {error && (
                      <div className="notice notice--error">❌ {error}</div>
                    )}

                    {result && (
                      <div className="analysis-results">
                        <VerdictBanner verdict={result.verdict} />
                        <IntuitionCard intuition={result.intuition} />
                        <MethodCard method={result.method} />
                        <ComplexityCard complexity={result.complexity} />
                        <ComparisonCard approaches={result.comparison.approaches} />
                        <CodeStyleCard codeStyle={result.codeStyle} />
                        <ConceptsCard concepts={result.concepts} />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="tab-panel tab-panel--chat">
                    <div className="chat-toolbar">
                      <button
                        className="chat-rescan"
                        onClick={rescanCode}
                        disabled={isRescanning}
                      >
                        {isRescanning ? "⟳ Scanning…" : "⟳ Rescan Code"}
                      </button>
                    </div>
                    <ChatPanel
                      messages={messages}
                      loading={chatLoading}
                      error={chatError}
                      bottomRef={bottomRef}
                    />
                    <ChatInput
                      onSend={handleChatSend}
                      disabled={!loaded || chatLoading || isRescanning}
                    />
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="tab-panel tab-panel--scroll">
                    <SettingsPanel />
                  </div>
                )}
              </main>
            </>
          )}
        </aside>
      )}
    </div>
  )
}
