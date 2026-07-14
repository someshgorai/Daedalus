import { useState, useCallback, useRef, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { parseResponse } from "~/utils/markdown"
import type {
  ChatMsg,
  ChatRequest,
  ChatResponse,
  LCContext,
} from "~/utils/types"

function makeId(): string {
  return crypto.randomUUID()
}

function buildMsg(
  role: "user" | "assistant",
  content: string,
): ChatMsg {
  return {
    id: makeId(),
    role,
    content,
    segments: parseResponse(content),
    timestamp: Date.now(),
  }
}

export function useChat(context: LCContext | null) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Avoid stale chat history without rebuilding the send callback every turn.
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = useCallback(
    async (text: string, contextOverride?: LCContext) => {
      const activeContext = contextOverride ?? context
      if (!text.trim() || !activeContext || loading) return

      const userMsg = buildMsg("user", text)
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      setError(null)

      try {
        const res = await sendToBackground<ChatRequest, ChatResponse>({
          name: "chat",
          body: {
            context: activeContext,
            history: messagesRef.current,
            message: text,
          },
        })

        if (res.error) throw new Error(res.error)

        const assistantMsg = buildMsg("assistant", res.reply ?? "")
        setMessages((prev) => [...prev, assistantMsg])
      } catch (e) {
        setError((e as Error).message)
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      } finally {
        setLoading(false)
      }
    },
    [context, loading],
  )

  return {
    messages,
    loading,
    error,
    send,
    bottomRef,
  }
}
