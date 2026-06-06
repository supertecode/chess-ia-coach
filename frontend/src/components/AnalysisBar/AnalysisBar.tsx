import { useTranslation } from 'react-i18next'

import type { Score } from '../../types'

interface AnalysisBarProps {
  score: Score | null
  isLoading: boolean
}

/** Centipawn cap for the fill bar (±10 pawns). */
const CP_CLAMP = 1000

function formatScore(score: Score): string {
  if (score.type === 'mate') {
    const sign = score.value >= 0 ? '' : '-'
    return `${sign}M${Math.abs(score.value)}`
  }
  const pawns = score.value / 100
  const sign = pawns > 0 ? '+' : ''
  return `${sign}${pawns.toFixed(1)}`
}

/** White-advantage percentage [0..100] from White's perspective. */
function whitePercent(score: Score): number {
  if (score.type === 'mate') return score.value >= 0 ? 100 : 0
  const clamped = Math.max(-CP_CLAMP, Math.min(CP_CLAMP, score.value))
  return ((clamped + CP_CLAMP) / (2 * CP_CLAMP)) * 100
}

export function AnalysisBar({ score, isLoading }: AnalysisBarProps) {
  const { t } = useTranslation()
  const pct = score ? whitePercent(score) : 50
  const label = score ? formatScore(score) : '—'

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
        <span>{t('analysis.evaluation')}</span>
        <span className="font-mono text-sm text-white">
          {isLoading ? t('analysis.thinking') : label}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800 ring-1 ring-neutral-700">
        <div
          className="h-full bg-neutral-100 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
