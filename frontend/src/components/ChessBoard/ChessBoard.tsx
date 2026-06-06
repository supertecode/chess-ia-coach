import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'

import type { ApiArrow } from '../../types'
import type { BoardOrientation, LastMove } from '../../hooks/useChessGame'

interface ChessBoardProps {
  fen: string
  orientation: BoardOrientation
  /** Combined arrows (Stockfish + LLM), in backend {from,to,color} shape. */
  arrows: ApiArrow[]
  lastMove: LastMove | null
  onMove: (from: string, to: string) => boolean
}

const LAST_MOVE_HIGHLIGHT = { background: 'rgba(0, 255, 136, 0.28)' }

export function ChessBoard({
  fen,
  orientation,
  arrows,
  lastMove,
  onMove,
}: ChessBoardProps) {
  const options = useMemo(() => {
    const squareStyles: Record<string, React.CSSProperties> = {}
    if (lastMove) {
      squareStyles[lastMove.from] = LAST_MOVE_HIGHLIGHT
      squareStyles[lastMove.to] = LAST_MOVE_HIGHLIGHT
    }

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
      onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
        if (!targetSquare) return false
        return onMove(sourceSquare, targetSquare)
      },
    }
  }, [fen, orientation, arrows, lastMove, onMove])

  return (
    <div className="w-full max-w-[560px]">
      <Chessboard options={options} />
    </div>
  )
}
