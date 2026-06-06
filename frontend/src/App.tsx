import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnalysisBar } from './components/AnalysisBar/AnalysisBar'
import { ChatPanel } from './components/ChatPanel/ChatPanel'
import { ChessBoard } from './components/ChessBoard/ChessBoard'
import { GameControls } from './components/GameControls/GameControls'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { MoveHistory } from './components/MoveHistory/MoveHistory'
import { PromotionDialog } from './components/PromotionDialog/PromotionDialog'
import { ResizeDivider } from './components/ResizeDivider/ResizeDivider'
import {
  DIVIDER_WIDTH,
  LAYOUT_DEFAULTS,
  LAYOUT_MINIMUMS,
  clampLayoutValues,
} from './config/layoutConfig'
import { useAnalysis } from './hooks/useAnalysis'
import { useChat } from './hooks/useChat'
import { useChessGame } from './hooks/useChessGame'
import { usePanelResize } from './hooks/usePanelResize'
import { useSquareSize } from './hooks/useSquareSize'
import type { ApiArrow, CoachMode } from './types'

const MODE_STORAGE_KEY = 'llmMode'
const VALID_MODES: CoachMode[] = ['quick', 'full', 'socratic']

function readWidth(key: string, fallback: number): number {
  const saved = Number(localStorage.getItem(key))
  return saved > 0 ? saved : fallback
}

function App() {
  const { t, i18n } = useTranslation()
  const language = i18n.language.startsWith('pt') ? 'pt-BR' : 'en'

  const game = useChessGame()

  // LLM coaching mode, persisted in localStorage.
  const [mode, setMode] = useState<CoachMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as CoachMode | null
    return stored && VALID_MODES.includes(stored) ? stored : 'full'
  })
  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  // Best-move arrow toggle, persisted in localStorage (default off).
  const [showBestMove, setShowBestMove] = useState<boolean>(
    () => localStorage.getItem('showBestMove') === 'true',
  )
  useEffect(() => {
    localStorage.setItem('showBestMove', String(showBestMove))
  }, [showBestMove])

  // Resizable panel widths (clamped to the current window on load).
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const left = readWidth('layout_leftWidth', LAYOUT_DEFAULTS.leftWidth)
    const right = readWidth('layout_rightWidth', LAYOUT_DEFAULTS.rightWidth)
    return clampLayoutValues(left, right).left
  })
  const [rightWidth, setRightWidth] = useState<number>(() => {
    const left = readWidth('layout_leftWidth', LAYOUT_DEFAULTS.leftWidth)
    const right = readWidth('layout_rightWidth', LAYOUT_DEFAULTS.rightWidth)
    return clampLayoutValues(left, right).right
  })

  useEffect(() => {
    localStorage.setItem('layout_leftWidth', String(leftWidth))
  }, [leftWidth])
  useEffect(() => {
    localStorage.setItem('layout_rightWidth', String(rightWidth))
  }, [rightWidth])

  // Re-clamp panels if the window becomes too narrow for the current widths.
  useEffect(() => {
    const onResize = () => {
      const clamped = clampLayoutValues(leftWidth, rightWidth)
      if (clamped.left !== leftWidth) setLeftWidth(clamped.left)
      if (clamped.right !== rightWidth) setRightWidth(clamped.right)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [leftWidth, rightWidth])

  const { startDrag, startTouchDrag } = usePanelResize({
    leftWidth,
    rightWidth,
    setLeftWidth,
    setRightWidth,
    minLeft: LAYOUT_MINIMUMS.left,
    minCenter: LAYOUT_MINIMUMS.center,
    minRight: LAYOUT_MINIMUMS.right,
    dividerWidth: DIVIDER_WIDTH,
  })

  // Debounced + cancellable auto-analysis (see useAnalysis).
  const {
    analysis,
    isLoading: analysisLoading,
    error: analysisError,
  } = useAnalysis({ fen: game.fen, enabled: !game.isGameOver })

  const [llmArrows, setLlmArrows] = useState<ApiArrow[]>([])

  // Clear the coach's arrows whenever the position changes.
  useEffect(() => {
    setLlmArrows([])
  }, [game.fen])

  const chatContext = useMemo(
    () => ({
      fen: game.fen,
      analysis: analysis
        ? { best_move: analysis.best_move, score: analysis.score }
        : undefined,
      language,
      mode,
    }),
    [game.fen, analysis, language, mode],
  )
  const chat = useChat(chatContext, t('chat.greeting'))

  // New Game: reset board + chat (back to greeting only).
  const handleNewGame = () => {
    game.reset()
    chat.reset()
  }

  // Compose board arrows, de-duplicating by square pair (the board keys arrows
  // by from/to, ignoring color). Later inserts win on a tie.
  const boardArrows = useMemo<ApiArrow[]>(() => {
    const bySquares = new Map<string, ApiArrow>()

    // Last move (yellow) — always shown.
    if (game.lastMove) {
      const { from, to } = game.lastMove
      bySquares.set(`${from}-${to}`, { from, to, color: 'rgba(255,255,100,0.6)' })
    }
    // Best move (green) — only when the toggle is on and analysis exists.
    if (showBestMove && analysis?.best_move) {
      const from = analysis.best_move.slice(0, 2)
      const to = analysis.best_move.slice(2, 4)
      bySquares.set(`${from}-${to}`, { from, to, color: '#00cc66' })
    }
    // Coach (LLM) arrows take priority on shared squares.
    for (const a of llmArrows) bySquares.set(`${a.from}-${a.to}`, a)

    return [...bySquares.values()]
  }, [game.lastMove, showBestMove, analysis, llmArrows])

  const handleSend = async (text: string) => {
    const arrows = await chat.send(text)
    if (arrows.length) setLlmArrows(arrows)
  }

  // Sizes the board to the largest square that fits the center column.
  const { ref: boardAreaRef, size: boardSize } = useSquareSize<HTMLDivElement>()

  // Keyboard navigation through move history (ignored while typing).
  const { goBack, goForward } = game
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') goBack()
      else if (e.key === 'ArrowRight') goForward()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">{t('app.title')}</h1>
        <LanguageSwitcher />
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* LEFT — controls + move history */}
        <aside
          style={{ width: leftWidth, minWidth: LAYOUT_MINIMUMS.left }}
          className="flex shrink-0 flex-col gap-3 overflow-hidden border-r border-neutral-800 p-3"
        >
          <GameControls
            onNewGame={handleNewGame}
            onFlip={game.flip}
            onLoadFen={game.loadFen}
            onLoadPgn={game.loadPgn}
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            <MoveHistory
              history={game.history}
              currentIndex={game.currentIndex}
              onSelect={game.goToMove}
              onStart={game.goToStart}
              onBack={game.goBack}
              onForward={game.goForward}
              onEnd={game.goToEnd}
            />
          </div>
        </aside>

        <ResizeDivider
          side="left"
          onMouseDown={startDrag}
          onTouchStart={startTouchDrag}
        />

        {/* CENTER — board (square, centered) + eval bar */}
        <main
          style={{ minWidth: LAYOUT_MINIMUMS.center }}
          className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3"
        >
          {/* Board header with the best-move toggle. */}
          <div className="flex shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={() => setShowBestMove((v) => !v)}
              aria-pressed={showBestMove}
              title={
                showBestMove ? t('board.hideBestMove') : t('board.showBestMove')
              }
              className={`rounded-md border px-2 py-1 text-lg leading-none transition ${
                showBestMove
                  ? 'border-emerald-500 text-yellow-300 shadow-[0_0_8px_rgba(0,204,102,0.55)]'
                  : 'border-neutral-700 text-neutral-500 opacity-40 hover:opacity-70'
              }`}
            >
              💡
            </button>
          </div>

          {game.isViewingHistory && (
            <div className="shrink-0 rounded-md bg-amber-900/40 px-3 py-1 text-center text-xs text-amber-300">
              {t('game.readOnlyNotice')}
            </div>
          )}
          <div
            ref={boardAreaRef}
            className="flex min-h-0 flex-1 items-center justify-center"
          >
            <div style={{ width: boardSize, height: boardSize }}>
              <ChessBoard
                fen={game.fen}
                orientation={game.orientation}
                arrows={boardArrows}
                lastMove={game.lastMove}
                onMove={game.makeMove}
                allowMoves={!game.isViewingHistory}
                legalMoveSquares={game.legalMoveSquares}
                onSquareClick={game.onSquareClick}
              />
            </div>
          </div>

          <div className="shrink-0 space-y-1">
            <AnalysisBar
              score={analysis?.score ?? null}
              isLoading={analysisLoading}
            />
            <div className="h-5 text-center text-sm text-neutral-400">
              {game.isGameOver
                ? t('game.over')
                : t('game.turn', {
                    side: game.turn === 'w' ? t('game.white') : t('game.black'),
                  })}
              {analysisError && (
                <span className="ml-2 text-red-400">{analysisError}</span>
              )}
            </div>
          </div>
        </main>

        <PromotionDialog
          pending={game.pendingPromotion}
          onSelect={game.confirmPromotion}
          onCancel={game.cancelPromotion}
        />

        <ResizeDivider
          side="right"
          onMouseDown={startDrag}
          onTouchStart={startTouchDrag}
        />

        {/* RIGHT — chat */}
        <aside
          style={{ width: rightWidth, minWidth: LAYOUT_MINIMUMS.right }}
          className="flex shrink-0 flex-col overflow-hidden border-l border-neutral-800 p-3"
        >
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            error={chat.error}
            mode={mode}
            onModeChange={setMode}
            onSend={handleSend}
            onClear={chat.clear}
          />
        </aside>
      </div>
    </div>
  )
}

export default App
