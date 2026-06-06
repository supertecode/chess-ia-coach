import { useCallback, useRef, useState } from 'react'

import { sendChat, toApiError } from '../services/api'
import type {
  ApiArrow,
  ChatAnalysisContext,
  ChatMessage,
  CoachMode,
} from '../types'

export interface ChatContext {
  fen: string
  analysis: ChatAnalysisContext | undefined
  language: string
  mode: CoachMode
}

export interface UseChat {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  /** Sends a user message; resolves with the assistant's suggested arrows. */
  send: (text: string) => Promise<ApiArrow[]>
  clear: () => void
  /** Reset to just the greeting message (used on New Game). */
  reset: () => void
}

/**
 * Chat state + API calls. The latest board context (fen/analysis/language) is
 * read from a ref at send time to avoid stale closures.
 */
export function useChat(context: ChatContext, greeting: string): UseChat {
  const contextRef = useRef(context)
  contextRef.current = context

  // Keep the latest greeting (it changes with the UI language) for reset().
  const greetingRef = useRef(greeting)
  greetingRef.current = greeting

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'assistant', content: greeting },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref of messages so `send` can read history without being recreated.
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages

  const send = useCallback(async (text: string): Promise<ApiArrow[]> => {
    const trimmed = text.trim()
    if (!trimmed) return []

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    // Capture history BEFORE appending the new user turn.
    const history = messagesRef.current
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    const { fen, analysis, language, mode } = contextRef.current
    try {
      const response = await sendChat({
        message: trimmed,
        fen,
        analysis,
        history,
        language,
        mode,
      })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply },
      ])
      return response.arrows
    } catch (err) {
      setError(toApiError(err).error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setMessages([{ role: 'assistant', content: greetingRef.current }])
    setError(null)
  }, [])

  return { messages, isLoading, error, send, clear, reset }
}
