import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnalysisBar } from './components/AnalysisBar/AnalysisBar'
import { ChatPanel } from './components/ChatPanel/ChatPanel'
import { ChessBoard } from './components/ChessBoard/ChessBoard'
import { GameControls } from './components/GameControls/GameControls'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { useAnalysis } from './hooks/useAnalysis'
import { useChat } from './hooks/useChat'
import { useChessGame } from './hooks/useChessGame'
import type { ApiArrow } from './types'

function App() {
  const { t, i18n } = useTranslation()
  const language = i18n.language.startsWith('pt') ? 'pt-BR' : 'en'

  const game = useChessGame()

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
    }),
    [game.fen, analysis, language],
  )
  const chat = useChat(chatContext)

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

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">{t('app.title')}</h1>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 flex-col gap-4 lg:flex-row">
        {/* Board column */}
        <section className="flex flex-col items-center gap-3 lg:w-140">
          <AnalysisBar score={analysis?.score ?? null} isLoading={analysisLoading} />
          <ChessBoard
            fen={game.fen}
            orientation={game.orientation}
            arrows={boardArrows}
            lastMove={game.lastMove}
            onMove={game.makeMove}
          />
          <div className="h-5 text-sm text-neutral-400">
            {game.isGameOver
              ? t('game.over')
              : t('game.turn', {
                  side: game.turn === 'w' ? t('game.white') : t('game.black'),
                })}
            {analysisError && (
              <span className="ml-2 text-red-400">{analysisError}</span>
            )}
          </div>
          <GameControls
            onNewGame={game.reset}
            onFlip={game.flip}
            onLoadFen={game.loadFen}
            onLoadPgn={game.loadPgn}
          />
        </section>

        {/* Chat column */}
        <section className="min-h-120 flex-1 lg:min-h-0">
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            error={chat.error}
            onSend={handleSend}
            onClear={chat.clear}
          />
        </section>
      </main>
    </div>
  )
}

export default App
