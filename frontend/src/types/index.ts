// Shared types — mirror the backend Pydantic schemas (see backend/app/models).

export interface Score {
  type: 'cp' | 'mate'
  value: number
}

/** Arrow as returned by the backend (uses from/to keys). */
export interface ApiArrow {
  from: string
  to: string
  color: string
}

export interface MoveScore {
  move: string
  score: number
}

export interface AnalysisResponse {
  best_move: string | null
  score: Score
  top_moves: MoveScore[]
  arrows: ApiArrow[]
}

export interface AnalysisRequest {
  fen: string
  depth?: number
}

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatAnalysisContext {
  best_move?: string | null
  score?: Score | null
}

export interface ChatRequest {
  message: string
  fen?: string
  analysis?: ChatAnalysisContext
  history?: ChatMessage[]
  language: string
}

export interface ChatResponse {
  reply: string
  arrows: ApiArrow[]
}

/** Normalized API error: { error, code }. */
export interface ApiError {
  error: string
  code: string
}
