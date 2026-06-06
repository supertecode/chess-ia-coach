import axios, { AxiosError } from 'axios'

import type {
  AnalysisRequest,
  AnalysisResponse,
  ApiError,
  ChatRequest,
  ChatResponse,
} from '../types'

// In dev, Vite proxies "/api" to the FastAPI backend (see vite.config.ts).
// In prod, set VITE_API_BASE_URL to the backend origin.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

/** Normalize any axios failure into our { error, code } shape. */
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<Partial<ApiError>>
    const data = axiosErr.response?.data
    if (data && typeof data.error === 'string') {
      return { error: data.error, code: data.code ?? 'UNKNOWN' }
    }
    if (axiosErr.code === 'ERR_NETWORK') {
      return { error: 'Cannot reach the server.', code: 'NETWORK_ERROR' }
    }
    return { error: axiosErr.message, code: 'REQUEST_ERROR' }
  }
  return { error: 'Unexpected error.', code: 'UNKNOWN' }
}

export async function getAnalysis(
  payload: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const { data } = await client.post<AnalysisResponse>('/api/analysis', payload, {
    signal,
  })
  return data
}

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await client.post<ChatResponse>('/api/chat', payload)
  return data
}
