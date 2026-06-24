import React from "react"
import type { ChatMsg } from "~/utils/types"
import { TypingDots } from "../ui/TypingDots"
import { CodeBlock } from "./CodeBlock"

interface ChatPanelProps {
  messages: ChatMsg[]
  loading: boolean
  error: string | null
  bottomRef: React.RefObject<HTMLDivElement>
}

export function ChatPanel({
  messages,
  loading,
  error,
  bottomRef,
}: ChatPanelProps) {
  return (
    <div className="chat-messages">
      {messages.length === 0 && (
        <div className="chat-empty">
          <span className="chat-empty__icon">💬</span>
          <p>Ask for a hint or clarification about your solution...</p>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.role === "user"
        return (
          <div
            className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}
            key={message.id}
          >
            <div className="chat-avatar">{isUser ? "U" : "⚡"}</div>
            <div className="chat-bubble">
              {message.segments.map((segment, index) => (
                segment.type === "text" ? (
                  <p className="chat-text" key={index}>{segment.content}</p>
                ) : (
                  <CodeBlock
                    code={segment.content}
                    key={index}
                    language={segment.language}
                    note={segment.note}
                  />
                )
              ))}
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="chat-message chat-message--assistant">
          <div className="chat-avatar">⚡</div>
          <TypingDots />
        </div>
      )}

      {error && <div className="chat-error">❌ {error}</div>}
      <div ref={bottomRef} />
    </div>
  )
}

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void
  disabled: boolean
}) {
  const [value, setValue] = React.useState("")
  const canSend = Boolean(value.trim()) && !disabled

  const submit = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue("")
  }

  return (
    <div className="chat-input">
      <input
        className="chat-input__field"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && submit()}
        placeholder={disabled ? "Scan the problem first…" : "Ask for a hint…"}
        disabled={disabled}
      />
      <button
        className={`chat-input__send ${canSend ? "chat-input__send--ready" : ""}`}
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
      >
        ↑
      </button>
    </div>
  )
}
