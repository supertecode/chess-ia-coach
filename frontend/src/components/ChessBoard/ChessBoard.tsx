import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard'

import type { ApiArrow } from '../../types'
import type { BoardOrientation, LastMove } from '../../hooks/useChessGame'

interface ChessBoardProps {
  fen: string
  orientation: BoardOrientation
  /** Combined arrows (Stockfish + LLM), in backend {from,to,color} shape. */
  arrows: ApiArrow[]
  lastMove: LastMove | null
  onMove: (from: string, to: string) => boolean
  /** When false, dragging is disabled (e.g. browsing past positions). */
  allowMoves?: boolean
  /** Selected piece + legal-destination styles (click-to-move preview). */
  legalMoveSquares?: Record<string, React.CSSProperties>
  /** Click-to-move handler. */
  onSquareClick?: (square: string) => void
}

const LAST_MOVE_HIGHLIGHT = { background: 'rgba(0, 255, 136, 0.28)' }

export function ChessBoard({
  fen,
  orientation,
  arrows,
  lastMove,
  onMove,
  allowMoves = true,
  legalMoveSquares = {},
  onSquareClick,
}: ChessBoardProps) {
  const options = useMemo(() => {
    // Last-move highlight first; legal-move preview overrides on shared squares.
    const squareStyles: Record<string, React.CSSProperties> = {}
    if (lastMove) {
      squareStyles[lastMove.from] = LAST_MOVE_HIGHLIGHT
      squareStyles[lastMove.to] = LAST_MOVE_HIGHLIGHT
    }
    Object.assign(squareStyles, legalMoveSquares)

    return {
      id: 'main-board',
      position: fen,
      boardOrientation: orientation,
      arrows: arrows.map((a) => ({
        startSquare: a.from,
        endSquare: a.to,
        color: a.color,
      })),
      squareStyles,
      darkSquareStyle: { backgroundColor: '#769656' },
      lightSquareStyle: { backgroundColor: '#eeeed2' },
      animationDurationInMs: 200,
      allowDragging: allowMoves,
      onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
        if (!targetSquare) return false
        return onMove(sourceSquare, targetSquare)
      },
      onSquareClick: ({ square }: SquareHandlerArgs) => onSquareClick?.(square),
    }
  }, [
    fen,
    orientation,
    arrows,
    lastMove,
    onMove,
    allowMoves,
    legalMoveSquares,
    onSquareClick,
  ])

  // Fills its parent; the parent is sized to a square via useSquareSize.
  return <Chessboard options={options} />
}
