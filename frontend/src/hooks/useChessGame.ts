import { useCallback, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import type { Move, Square } from 'chess.js'

export type BoardOrientation = 'white' | 'black'
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

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

export interface PendingPromotion {
  from: string
  to: string
  color: 'w' | 'b'
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
  /** Set while waiting for the user to pick a promotion piece. */
  pendingPromotion: PendingPromotion | null
  /** Square styles for the selected piece + its legal destinations. */
  legalMoveSquares: Record<string, CSSProperties>
  /** Click-to-move + legal-move preview handler. */
  onSquareClick: (square: string) => void
  makeMove: (from: string, to: string) => boolean
  confirmPromotion: (piece: PromotionPiece) => void
  cancelPromotion: () => void
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
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState<
    Record<string, CSSProperties>
  >({})

  const clearSelection = useCallback(() => {
    setSelectedSquare(null)
    setLegalMoveSquares({})
  }, [])

  const atEnd = currentIndex === history.length - 1
  const isViewingHistory = currentIndex < history.length - 1

  const fen = currentIndex === -1 ? initialFen : history[currentIndex].fen
  const turn = (fen.split(' ')[1] as 'w' | 'b') || 'w'
  const isGameOver = atEnd && game.isGameOver()
  const lastMove =
    currentIndex >= 0
      ? { from: history[currentIndex].from, to: history[currentIndex].to }
      : null

  /** Would moving from→to be a pawn promotion in the current position? */
  const isPromotion = useCallback(
    (from: string, to: string): boolean => {
      const piece = game.get(from as Square)
      if (!piece || piece.type !== 'p') return false
      return (
        (piece.color === 'w' && to[1] === '8') ||
        (piece.color === 'b' && to[1] === '1')
      )
    },
    [game],
  )

  /** Executes a move on the live engine and appends it to history. */
  const doMove = useCallback(
    (from: string, to: string, promotion: PromotionPiece = 'q'): boolean => {
      try {
        const move = game.move({ from, to, promotion })
        setHistory((h) => [...h, toEntry(move)])
        setCurrentIndex((i) => i + 1)
        clearSelection()
        return true
      } catch {
        return false
      }
    },
    [game, clearSelection],
  )

  const makeMove = useCallback(
    (from: string, to: string): boolean => {
      // Only the live (last) position is playable.
      if (currentIndex !== history.length - 1) return false
      if (isPromotion(from, to)) {
        const color = game.get(from as Square)?.color ?? 'w'
        setPendingPromotion({ from, to, color })
        // Return false so the dragged pawn snaps back; the real move happens
        // once the user picks a piece in the promotion dialog.
        return false
      }
      return doMove(from, to)
    },
    [game, currentIndex, history.length, isPromotion, doMove],
  )

  const confirmPromotion = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return
      doMove(pendingPromotion.from, pendingPromotion.to, piece)
      setPendingPromotion(null)
    },
    [pendingPromotion, doMove],
  )

  const onSquareClick = useCallback(
    (square: string) => {
      // No selection / click-to-move while browsing past positions.
      if (isViewingHistory) return

      // A piece is selected and this square is a legal destination → move.
      if (selectedSquare && square !== selectedSquare && legalMoveSquares[square]) {
        makeMove(selectedSquare, square)
        clearSelection()
        return
      }

      const piece = game.get(square as Square)
      // Re-clicking the selected piece (or selecting own piece) toggles/selects.
      if (piece && piece.color === game.turn()) {
        if (square === selectedSquare) {
          clearSelection()
          return
        }
        const highlights: Record<string, CSSProperties> = {
          [square]: { backgroundColor: 'rgba(255, 255, 100, 0.4)' },
        }
        for (const move of game.moves({ square: square as Square, verbose: true })) {
          highlights[move.to] = move.captured
            ? {
                boxShadow: 'inset 0 0 0 4px rgba(255, 100, 100, 0.7)',
                borderRadius: '2px',
              }
            : {
                background:
                  'radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 26%)',
                borderRadius: '50%',
              }
        }
        setSelectedSquare(square)
        setLegalMoveSquares(highlights)
        return
      }

      // Clicked elsewhere → deselect.
      clearSelection()
    },
    [isViewingHistory, selectedSquare, legalMoveSquares, game, makeMove, clearSelection],
  )

  const cancelPromotion = useCallback(() => setPendingPromotion(null), [])

  const loadFen = useCallback(
    (next: string): boolean => {
      try {
        game.load(next)
        setInitialFen(game.fen())
        setHistory([])
        setCurrentIndex(-1)
        setPendingPromotion(null)
        clearSelection()
        return true
      } catch {
        return false
      }
    },
    [game, clearSelection],
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
        setPendingPromotion(null)
        clearSelection()
        return true
      } catch {
        return false
      }
    },
    [game, clearSelection],
  )

  const reset = useCallback(() => {
    game.reset()
    setInitialFen(START_FEN)
    setHistory([])
    setCurrentIndex(-1)
    setPendingPromotion(null)
    clearSelection()
  }, [game, clearSelection])

  const flip = useCallback(() => {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }, [])

  const goToMove = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(-1, Math.min(index, history.length - 1)))
      clearSelection()
    },
    [history.length, clearSelection],
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
    pendingPromotion,
    legalMoveSquares,
    onSquareClick,
    makeMove,
    confirmPromotion,
    cancelPromotion,
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
