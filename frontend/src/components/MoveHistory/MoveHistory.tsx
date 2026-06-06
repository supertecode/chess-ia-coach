import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { MoveHistoryEntry } from '../../hooks/useChessGame'

interface MoveHistoryProps {
  history: MoveHistoryEntry[]
  currentIndex: number
  onSelect: (index: number) => void
  onStart: () => void
  onBack: () => void
  onForward: () => void
  onEnd: () => void
}

interface Row {
  number: number
  white?: { san: string; index: number }
  black?: { san: string; index: number }
}

/** Group half-moves into numbered rows (handles positions starting on black). */
function buildRows(history: MoveHistoryEntry[]): Row[] {
  const rows: Row[] = []
  history.forEach((entry, index) => {
    const token = { san: entry.san, index }
    const last = rows[rows.length - 1]
    if (entry.color === 'w') {
      rows.push({ number: entry.moveNumber, white: token })
    } else if (last && last.number === entry.moveNumber && !last.black) {
      last.black = token
    } else {
      rows.push({ number: entry.moveNumber, black: token })
    }
  })
  return rows
}

export function MoveHistory({
  history,
  currentIndex,
  onSelect,
  onStart,
  onBack,
  onForward,
  onEnd,
}: MoveHistoryProps) {
  const { t } = useTranslation()
  const rows = buildRows(history)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [currentIndex])

  const token = (move?: { san: string; index: number }) => {
    if (!move) return <span className="px-1 text-neutral-600">·</span>
    const active = move.index === currentIndex
    return (
      <button
        type="button"
        ref={active ? activeRef : undefined}
        onClick={() => onSelect(move.index)}
        className={`rounded px-1.5 py-0.5 text-left font-mono text-sm hover:bg-neutral-700 ${
          active ? 'bg-emerald-600 text-white' : 'text-neutral-200'
        }`}
      >
        {move.san}
      </button>
    )
  }

  const navBtn =
    'flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40'
  const atStart = currentIndex < 0
  const atEnd = currentIndex >= history.length - 1

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-700 bg-neutral-900">
      <header className="border-b border-neutral-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {t('history.title')}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {rows.length === 0 ? (
          <p className="p-1 text-sm text-neutral-500">{t('history.empty')}</p>
        ) : (
          <ol className="space-y-0.5">
            {rows.map((row) => (
              <li
                key={`${row.number}-${row.white?.index ?? 'b'}`}
                className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1"
              >
                <span className="text-right text-xs text-neutral-500">
                  {row.number}.
                </span>
                {token(row.white)}
                {token(row.black)}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex gap-1 border-t border-neutral-700 p-2">
        <button
          type="button"
          className={navBtn}
          onClick={onStart}
          disabled={atStart}
          title={t('nav.start')}
        >
          ⏮
        </button>
        <button
          type="button"
          className={navBtn}
          onClick={onBack}
          disabled={atStart}
          title={t('nav.back')}
        >
          ◀
        </button>
        <button
          type="button"
          className={navBtn}
          onClick={onForward}
          disabled={atEnd}
          title={t('nav.forward')}
        >
          ▶
        </button>
        <button
          type="button"
          className={navBtn}
          onClick={onEnd}
          disabled={atEnd}
          title={t('nav.end')}
        >
          ⏭
        </button>
      </div>
    </div>
  )
}
