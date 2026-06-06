import { useTranslation } from 'react-i18next'

import type { PendingPromotion, PromotionPiece } from '../../hooks/useChessGame'
import { Modal } from '../Modal'

interface PromotionDialogProps {
  pending: PendingPromotion | null
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
}

// Filled glyphs render clearly on the dark theme for both colors.
const PIECES: { type: PromotionPiece; glyph: string; labelKey: string }[] = [
  { type: 'q', glyph: '♛', labelKey: 'promotion.queen' },
  { type: 'r', glyph: '♜', labelKey: 'promotion.rook' },
  { type: 'b', glyph: '♝', labelKey: 'promotion.bishop' },
  { type: 'n', glyph: '♞', labelKey: 'promotion.knight' },
]

export function PromotionDialog({
  pending,
  onSelect,
  onCancel,
}: PromotionDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={pending !== null}
      title={t('promotion.title')}
      onClose={onCancel}
    >
      <div className="flex justify-center gap-3">
        {PIECES.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => onSelect(p.type)}
            title={t(p.labelKey)}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 hover:border-emerald-500 hover:bg-neutral-700"
          >
            <span className="text-3xl leading-none text-white">{p.glyph}</span>
            <span className="mt-1 text-[10px] text-neutral-400">
              {t(p.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
