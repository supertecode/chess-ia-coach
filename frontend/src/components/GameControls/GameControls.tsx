import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '../Modal'

interface GameControlsProps {
  onNewGame: () => void
  onFlip: () => void
  onLoadFen: (fen: string) => boolean
  onLoadPgn: (pgn: string) => boolean
}

export function GameControls({
  onNewGame,
  onFlip,
  onLoadFen,
  onLoadPgn,
}: GameControlsProps) {
  const { t } = useTranslation()
  const [fenInput, setFenInput] = useState('')
  const [pgnInput, setPgnInput] = useState('')
  const [pgnOpen, setPgnOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pgnError, setPgnError] = useState<string | null>(null)

  const handleLoadFen = () => {
    if (!fenInput.trim()) return
    const ok = onLoadFen(fenInput.trim())
    setLoadError(ok ? null : t('controls.invalidFen'))
    if (ok) setFenInput('')
  }

  const handleLoadPgn = () => {
    if (!pgnInput.trim()) return
    const ok = onLoadPgn(pgnInput.trim())
    if (ok) {
      setPgnInput('')
      setPgnError(null)
      setPgnOpen(false)
    } else {
      setPgnError(t('controls.invalidPgn'))
    }
  }

  const btn =
    'rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700'
  const loadBtn =
    'rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-900 p-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onNewGame} className={btn}>
          {t('controls.newGame')}
        </button>
        <button type="button" onClick={onFlip} className={btn}>
          {t('controls.flip')}
        </button>
        <button type="button" onClick={() => setPgnOpen(true)} className={btn}>
          {t('controls.loadPgn')}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <input
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder={t('controls.fenPlaceholder')}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
        />
        <button type="button" onClick={handleLoadFen} className={loadBtn}>
          {t('controls.loadFen')}
        </button>
        {loadError && <p className="text-sm text-red-400">{loadError}</p>}
      </div>

      <Modal
        open={pgnOpen}
        title={t('controls.pgnModalTitle')}
        onClose={() => setPgnOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <textarea
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            placeholder={t('controls.pgnPlaceholder')}
            rows={8}
            className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
          {pgnError && <p className="text-sm text-red-400">{pgnError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPgnOpen(false)}
              className={btn}
            >
              {t('common.cancel')}
            </button>
            <button type="button" onClick={handleLoadPgn} className={loadBtn}>
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
