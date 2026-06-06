import { useEffect, useState } from 'react'

import { getAnalysis, toApiError } from '../services/api'
import type { AnalysisResponse } from '../types'

/** Wait this long after the last position change before hitting the engine. */
const DEBOUNCE_MS = 300

interface UseAnalysisOptions {
  fen: string
  /** Skip analysis when false (e.g. the game is over). */
  enabled: boolean
  depth?: number
}

interface UseAnalysisResult {
  analysis: AnalysisResponse | null
  isLoading: boolean
  error: string | null
}

/**
 * Auto-analyzes a position with two guards against request bursts:
 *  - debounce: rapid moves / PGN scrubbing collapse into one call;
 *  - AbortController: a superseded request is actually cancelled (not just
 *    ignored), so the backend stops working on stale positions.
 */
export function useAnalysis({
  fen,
  enabled,
  depth = 15,
}: UseAnalysisOptions): UseAnalysisResult {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setAnalysis(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      getAnalysis({ fen, depth }, controller.signal)
        .then((res) => {
          setAnalysis(res)
          setIsLoading(false)
        })
        .catch((err) => {
          // Superseded by a newer position — leave state to the next run.
          if (controller.signal.aborted) return
          setError(toApiError(err).error)
          setAnalysis(null)
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fen, enabled, depth])

  return { analysis, isLoading, error }
}
