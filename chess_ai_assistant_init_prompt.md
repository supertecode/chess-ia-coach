# Chess AI Assistant — Prompt de Inicialização para Claude Code

> Cole este prompt diretamente no Claude Code (VS Code) para iniciar o projeto do zero.
> Ele foi escrito em inglês para maximizar a qualidade de resposta do modelo.

---

## PROMPT

```
You are an expert full-stack developer. I want you to scaffold a complete project called **Chess AI Assistant** — a chess study environment with an AI consultant chatbot. Follow every instruction precisely and ask for confirmation before each major phase if something is ambiguous.

---

## PROJECT OVERVIEW

A web application where users can:
- Play and study chess on an interactive board
- Load games via PGN or FEN notation
- Get real-time position analysis powered by Stockfish engine
- Chat with an AI consultant (LLM) that explains moves, strategies, and concepts
- See recommended moves highlighted visually on the board (arrows/highlights)
- Switch the interface language between Portuguese (pt-BR) and English

---

## TECH STACK

### Frontend
- **React** (Vite) with TypeScript
- **react-chessboard** for the interactive board component
- **chess.js** for game logic and move validation
- **i18next + react-i18next** for bilingual support (pt-BR / en)
- **Tailwind CSS** for styling
- A clean, dark-themed UI inspired by professional chess study tools (e.g., Lichess)

### Backend
- **Python 3.11+**
- **FastAPI** with async support
- **stockfish** Python library (wraps the Stockfish binary)
- **httpx** for async LLM API calls
- **python-dotenv** for environment configuration
- **pydantic** for data validation

### LLM Integration — Adapter Pattern (CRITICAL)
The LLM provider must be abstracted behind an interface so that switching providers only requires changing `.env` variables — NO code changes.

Implement an `LLMAdapter` abstract base class with concrete implementations for:
- **GroqAdapter** (default — uses `groq` SDK, model: `llama3-70b-8192`)
- **OpenAIAdapter** (uses `openai` SDK)
- **AnthropicAdapter** (uses `anthropic` SDK)
- **GeminiAdapter** (uses `google-generativeai` SDK)

A factory function `get_llm_adapter()` reads `LLM_PROVIDER` from `.env` and returns the correct adapter. All adapters must expose the same interface: `async def chat(messages: list[dict]) -> str`.

---

## PROJECT STRUCTURE

```
chess-ai-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChessBoard/          # Board + arrow overlays
│   │   │   ├── ChatPanel/           # Chat UI with message bubbles
│   │   │   ├── AnalysisBar/         # Evaluation bar (+/- score)
│   │   │   ├── GameControls/        # New game, load PGN/FEN, flip board
│   │   │   └── LanguageSwitcher/    # pt-BR / en toggle
│   │   ├── hooks/
│   │   │   ├── useChessGame.ts      # Game state management
│   │   │   └── useChat.ts           # Chat state + API calls
│   │   ├── services/
│   │   │   └── api.ts               # Axios instance + all API calls
│   │   ├── i18n/
│   │   │   ├── locales/en.json
│   │   │   └── locales/pt-BR.json
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS
│   │   ├── routers/
│   │   │   ├── chat.py              # POST /api/chat
│   │   │   └── analysis.py          # POST /api/analysis
│   │   ├── services/
│   │   │   ├── stockfish_service.py # Stockfish wrapper
│   │   │   └── llm/
│   │   │       ├── base.py          # LLMAdapter ABC
│   │   │       ├── groq_adapter.py
│   │   │       ├── openai_adapter.py
│   │   │       ├── anthropic_adapter.py
│   │   │       ├── gemini_adapter.py
│   │   │       └── factory.py       # get_llm_adapter()
│   │   └── models/
│   │       ├── chat.py              # Pydantic schemas for chat
│   │       └── analysis.py          # Pydantic schemas for analysis
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## API CONTRACTS

### POST /api/analysis
**Request:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "depth": 15
}
```
**Response:**
```json
{
  "best_move": "e7e5",
  "score": { "type": "cp", "value": -20 },
  "top_moves": [
    { "move": "e7e5", "score": -20 },
    { "move": "c7c5", "score": -35 }
  ],
  "arrows": [
    { "from": "e7", "to": "e5", "color": "#00ff88" }
  ]
}
```

### POST /api/chat
**Request:**
```json
{
  "message": "Why is Nf5 a strong move here?",
  "fen": "current FEN string",
  "analysis": { "best_move": "Nf5", "score": { "type": "cp", "value": 180 } },
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "language": "pt-BR"
}
```
**Response:**
```json
{
  "reply": "O Cavalo em f5 é poderoso porque...",
  "arrows": [
    { "from": "f3", "to": "f5", "color": "#ffaa00" }
  ]
}
```

---

## LLM SYSTEM PROMPT (inject this in every chat request)

```
You are a chess coach and expert analyst. You help players improve by explaining positions, plans, tactics, and strategic ideas clearly.

When analyzing a position:
1. Briefly describe the key features of the position
2. Explain WHY the recommended move is strong
3. Suggest a short-term plan for the side to move
4. Keep explanations concise but insightful — avoid dumping raw engine lines

Always respond in the language specified by the `language` field in the request (pt-BR or en).
When referencing moves, use standard algebraic notation.
```

---

## VISUAL REQUIREMENTS

### Board
- Use **react-chessboard** with a custom dark theme (dark squares: `#769656` green or similar professional palette)
- Render **arrows** on the board using the `customArrows` prop — sourced from both Stockfish analysis and LLM responses
- Highlight the last move squares

### Chat Panel
- Right-side panel with message bubbles (user right-aligned, AI left-aligned)
- Show a subtle typing indicator while waiting for LLM response
- Display the Stockfish evaluation score (+1.8 style) above the board in an evaluation bar

### Language Switcher
- Small toggle in the header (🇧🇷 / 🇬🇧)
- Persists choice in localStorage
- Changes both UI text (via i18next) AND the language sent to the LLM

---

## ENVIRONMENT VARIABLES (.env.example)

```env
# LLM Provider: groq | openai | anthropic | gemini
LLM_PROVIDER=groq

# API Keys (fill only the one you use)
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here

# LLM Model overrides (optional — adapters have sensible defaults)
GROQ_MODEL=llama3-70b-8192
OPENAI_MODEL=gpt-4o
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
GEMINI_MODEL=gemini-1.5-pro

# Stockfish
STOCKFISH_PATH=/usr/local/bin/stockfish
STOCKFISH_DEFAULT_DEPTH=15

# Backend
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
```

---

## ARCHITECTURE NOTES

1. **No authentication in MVP** — the app is session-based only. Design the codebase so that a user/auth layer can be added later without major refactoring (e.g., keep user context as an optional field in schemas).

2. **No database in MVP** — all state lives in React (frontend) and in-memory (backend). Design service interfaces so that a database layer (SQLite → PostgreSQL) can be plugged in later.

3. **Stockfish binary** — assume it is installed locally. The `STOCKFISH_PATH` env var points to the binary. The `stockfish` Python package wraps it via subprocess. Include install instructions in README.

4. **CORS** — backend must allow requests from `FRONTEND_URL` (configurable via env).

5. **Error handling** — all API endpoints must return structured errors: `{ "error": "message", "code": "ERROR_CODE" }`. Frontend must display user-friendly error messages (in the active language).

---

## DELIVERABLES — IMPLEMENT IN THIS ORDER

**Phase 1 — Project Scaffold**
- Create full directory structure
- Initialize frontend (Vite + React + TS + Tailwind + i18next)
- Initialize backend (FastAPI + requirements.txt)
- Create `.env.example` and `.gitignore`
- Create `README.md` with setup instructions (install Node deps, Python deps, Stockfish binary, run dev servers)

**Phase 2 — Backend Core**
- Implement all Pydantic models
- Implement `StockfishService` with `analyze(fen, depth)` method
- Implement all 4 LLM adapters + factory
- Implement `/api/analysis` and `/api/chat` endpoints
- Add CORS middleware

**Phase 3 — Frontend Core**
- Implement `useChessGame` hook (chess.js integration)
- Implement `useChat` hook
- Implement `api.ts` service
- Build `ChessBoard` component with arrow support
- Build `ChatPanel` component
- Build `GameControls` (new game, PGN/FEN input, flip board)
- Build `AnalysisBar` (evaluation score display)
- Build `LanguageSwitcher`
- Wire everything in `App.tsx`

**Phase 4 — i18n**
- Create `en.json` and `pt-BR.json` with all UI strings

**Phase 5 — Polish**
- Typing indicator in chat
- Responsive layout (sidebar collapses on small screens)
- Last move highlight on board
- Error boundary and user-facing error messages

---

Start with **Phase 1** and confirm completion before proceeding to Phase 2. Show me the full file tree after Phase 1 is done.
```
---

## NOTAS DE USO

- **Onde usar:** Cole o bloco acima (entre os ``` de código) diretamente no chat do Claude Code no VS Code.
- **Stockfish:** Você precisará instalar o binário separadamente. No Windows: baixe em https://stockfishchess.org/download/ e aponte o `STOCKFISH_PATH` no `.env`. No Ubuntu: `sudo apt install stockfish`.
- **GROQ:** Crie sua chave gratuita em https://console.groq.com — o modelo `llama3-70b-8192` é rápido e sem custo no free tier.
- **Fase a fase:** O prompt instrui o Claude Code a implementar em 5 fases confirmadas — isso evita que ele gere código incompleto de uma vez só.
