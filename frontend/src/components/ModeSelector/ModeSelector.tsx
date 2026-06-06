import { useTranslation } from 'react-i18next'

import type { CoachMode } from '../../types'

interface ModeSelectorProps {
  mode: CoachMode
  onChange: (mode: CoachMode) => void
}

const MODES: { id: CoachMode; icon: string }[] = [
  { id: 'quick', icon: '🏃' },
  { id: 'full', icon: '📖' },
  { id: 'socratic', icon: '🤔' },
]

/** Segmented control to pick the LLM coaching mode. */
export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-1 rounded-md border border-neutral-700 bg-neutral-800 p-1">
      {MODES.map((m) => {
        const active = m.id === mode
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={active}
            // Short label on the button; full name in the tooltip.
            title={t(`modes.${m.id}Long`)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <span aria-hidden>{m.icon}</span>
            <span className="truncate">{t(`modes.${m.id}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
