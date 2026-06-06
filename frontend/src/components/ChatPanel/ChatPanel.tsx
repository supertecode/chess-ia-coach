import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ChatMessage } from '../../types'

interface ChatPanelProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  onSend: (text: string) => void
  onClear: () => void
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-1 py-2" aria-label="assistant is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500" />
    </div>
  )
}

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSend,
  onClear,
}: ChatPanelProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isLoading])

  const submit = () => {
    const text = draft.trim()
    if (!text || isLoading) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-700 bg-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">{t('chat.title')}</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-neutral-400 hover:text-white"
        >
          {t('chat.clear')}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-neutral-500">{t('chat.empty')}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-800">
              <TypingIndicator />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="border-t border-neutral-700 p-3">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={2}
            placeholder={t('chat.placeholder')}
            className="flex-1 resize-none rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={isLoading || !draft.trim()}
            className="self-end rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('chat.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
