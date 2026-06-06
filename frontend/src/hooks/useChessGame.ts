import { useCallback, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

export type BoardOrientation = 'white' | 'black'

export interface MoveHistoryEntry {
  san: string
  fen: string // FEN after the move
  from: string
  to: string
  moveNumber: number
  color: 'w' | 'b'
}

export interface LastMove {
  from: string
  to: string
}

export interface UseChessGame {
  /** FEN of the position currently being viewed (may be a past position). */
  fen: string
  turn: 'w' | 'b'
  isGameOver: boolean
  lastMove: LastMove | null
  orientation: BoardOrientation
  history: MoveHistoryEntry[]
  currentIndex: number
  /** True when viewing a past position (board is read-only). */
  isViewingHistory: boolean
  makeMove: (from: string, to: string, promotion?: string) => boolean
  loadFen: (fen: string) => boolean
  loadPgn: (pgn: string) => boolean
  reset: () => void
  flip: () => void
  goToMove: (index: number) => void
  goBack: () => void
  goForward: () => void
  goToStart: () => void
  goToEnd: () => void
}

const START_FEN = new Chess().fen()

function toEntry(move: Move): MoveHistoryEntry {
  // `before`/`after` are FENs around the move; field [5] is the full-move number.
  return {
    san: move.san,
    fen: move.after,
    from: move.from,
    to: move.to,
    moveNumber: Number(move.before.split(' ')[5]) || 1,
    color: move.color,
  }
}

/**
 * Wraps a chess.js instance with a navigable move history. The live engine
 * (gameRef) always holds the latest position; `currentIndex` points at the
 * position being viewed (-1 = initial position). Moves are only allowed when
 * viewing the last position.
 */
export function useChessGame(): UseChessGame {
  const gameRef = useRef(new Chess())
  const game = gameRef.current

  const [initialFen, setInitialFen] = useState(START_FEN)
  const [history, setHistory] = useState<MoveHistoryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [orientation, setOrientation] = useState<BoardOrientation>('white')

  const atEnd = currentIndex === history.length - 1
  const isViewingHistory = currentIndex < history.length - 1

  const fen = currentIndex === -1 ? initialFen : history[currentIndex].fen
  const turn = (fen.split(' ')[1] as 'w' | 'b') || 'w'
  const isGameOver = atEnd && game.isGameOver()
  const lastMove =
    currentIndex >= 0
      ? { from: history[currentIndex].from, to: history[currentIndex].to }
      : null

  const makeMove = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      // Only the live (last) position is playable.
      if (currentIndex !== history.length - 1) return false
      try {
        const move = game.move({ from, to, promotion })
        setHistory((h) => [...h, toEntry(move)])
        setCurrentIndex((i) => i + 1)
        return true
      } catch {
        return false
      }
    },
    [game, currentIndex, history.length],
  )

  const loadFen = useCallback(
    (next: string): boolean => {
      try {
        game.load(next)
        setInitialFen(game.fen())
        setHistory([])
        setCurrentIndex(-1)
        return true
      } catch {
        return false
      }
    },
    [game],
  )

  const loadPgn = useCallback(
    (pgn: string): boolean => {
      try {
        game.loadPgn(pgn)
        const verbose = game.history({ verbose: true })
        const entries = verbose.map(toEntry)
        setInitialFen(verbose.length ? verbose[0].before : game.fen())
        setHistory(entries)
        setCurrentIndex(entries.length - 1)
        return true
      } catch {
        return false
      }
    },
    [game],
  )

  const reset = useCallback(() => {
    game.reset()
    setInitialFen(START_FEN)
    setHistory([])
    setCurrentIndex(-1)
  }, [game])

  const flip = useCallback(() => {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }, [])

  const goToMove = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(-1, Math.min(index, history.length - 1)))
    },
    [history.length],
  )

  const goBack = useCallback(
    () => goToMove(currentIndex - 1),
    [goToMove, currentIndex],
  )
  const goForward = useCallback(
    () => goToMove(currentIndex + 1),
    [goToMove, currentIndex],
  )
  const goToStart = useCallback(() => goToMove(-1), [goToMove])
  const goToEnd = useCallback(
    () => goToMove(history.length - 1),
    [goToMove, history.length],
  )

  return {
    fen,
    turn,
    isGameOver,
    lastMove,
    orientation,
    history,
    currentIndex,
    isViewingHistory,
    makeMove,
    loadFen,
    loadPgn,
    reset,
    flip,
    goToMove,
    goBack,
    goForward,
    goToStart,
    goToEnd,
  }
}
