import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnalysisBar } from './components/AnalysisBar/AnalysisBar'
import { ChatPanel } from './components/ChatPanel/ChatPanel'
import { ChessBoard } from './components/ChessBoard/ChessBoard'
import { GameControls } from './components/GameControls/GameControls'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { MoveHistory } from './components/MoveHistory/MoveHistory'
import { useAnalysis } from './hooks/useAnalysis'
import { useChat } from './hooks/useChat'
import { useChessGame } from './hooks/useChessGame'
import { useSquareSize } from './hooks/useSquareSize'
import type { ApiArrow, CoachMode } from './types'

const MODE_STORAGE_KEY = 'llmMode'
const VALID_MODES: CoachMode[] = ['quick', 'full', 'socratic']

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

  // Merge engine + coach arrows, de-duplicating by square pair (the board keys
  // arrows by from/to, ignoring color). The coach's color wins on a tie.
  const boardArrows = useMemo<ApiArrow[]>(() => {
    const bySquares = new Map<string, ApiArrow>()
    for (const a of analysis?.arrows ?? []) bySquares.set(`${a.from}-${a.to}`, a)
    for (const a of llmArrows) bySquares.set(`${a.from}-${a.to}`, a)
    return [...bySquares.values()]
  }, [analysis, llmArrows])

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
        {/* LEFT — controls + (move history in Phase 2) */}
        <aside className="flex w-70 shrink-0 flex-col gap-3 overflow-hidden border-r border-neutral-800 p-3">
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

        {/* CENTER — board (square, centered) + eval bar */}
        <main className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3">
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

        {/* RIGHT — chat */}
        <aside className="flex w-85 shrink-0 flex-col overflow-hidden border-l border-neutral-800 p-3">
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
