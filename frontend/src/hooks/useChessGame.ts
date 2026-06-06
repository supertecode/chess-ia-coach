import { useCallback, useRef, useState } from 'react'
import { Chess } from 'chess.js'

export type BoardOrientation = 'white' | 'black'

export interface LastMove {
  from: string
  to: string
}

export interface UseChessGame {
  fen: string
  turn: 'w' | 'b'
  isGameOver: boolean
  lastMove: LastMove | null
  orientation: BoardOrientation
  pgn: string
  makeMove: (from: string, to: string, promotion?: string) => boolean
  loadFen: (fen: string) => boolean
  loadPgn: (pgn: string) => boolean
  reset: () => void
  flip: () => void
}

/**
 * Wraps a chess.js instance and exposes immutable-ish state for React.
 * The engine lives in a ref; we bump `fen` (and friends) to trigger renders.
 */
export function useChessGame(): UseChessGame {
  const gameRef = useRef(new Chess())
  const game = gameRef.current

  const [fen, setFen] = useState(game.fen())
  const [pgn, setPgn] = useState(game.pgn())
  const [lastMove, setLastMove] = useState<LastMove | null>(null)
  const [orientation, setOrientation] = useState<BoardOrientation>('white')

  const sync = useCallback(() => {
    setFen(game.fen())
    setPgn(game.pgn())
  }, [game])

  const makeMove = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      try {
        const move = game.move({ from, to, promotion })
        setLastMove({ from: move.from, to: move.to })
        sync()
        return true
      } catch {
        return false
      }
    },
    [game, sync],
  )

  const loadFen = useCallback(
    (next: string): boolean => {
      try {
        game.load(next)
        setLastMove(null)
        sync()
        return true
      } catch {
        return false
      }
    },
    [game, sync],
  )

  const loadPgn = useCallback(
    (next: string): boolean => {
      try {
        game.loadPgn(next)
        const history = game.history({ verbose: true })
        const last = history.at(-1)
        setLastMove(last ? { from: last.from, to: last.to } : null)
        sync()
        return true
      } catch {
        return false
      }
    },
    [game, sync],
  )

  const reset = useCallback(() => {
    game.reset()
    setLastMove(null)
    sync()
  }, [game, sync])

  const flip = useCallback(() => {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }, [])

  return {
    fen,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    lastMove,
    orientation,
    pgn,
    makeMove,
    loadFen,
    loadPgn,
    reset,
    flip,
  }
}
