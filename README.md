# Chess AI Assistant

A chess study environment with an AI consultant chatbot. Play and study chess on
an interactive board, load games via PGN/FEN, get real-time position analysis
from the **Stockfish** engine, and chat with an **LLM** coach that explains
moves, plans, and ideas — with recommended moves drawn as arrows on the board.
The interface is bilingual (**pt-BR / en**).

> Status: Phase 1 scaffold. Backend endpoints and frontend UI are implemented in
> later phases.

## Tech Stack

**Frontend** — React (Vite) + TypeScript, [react-chessboard], [chess.js],
i18next (pt-BR / en), Tailwind CSS.

**Backend** — Python 3.11+ (works on 3.10), FastAPI (async), the `stockfish`
Python library, `httpx`, `pydantic`, `python-dotenv`.

**LLM integration** uses an adapter pattern: the provider is selected via the
`LLM_PROVIDER` env var (`groq` | `openai` | `anthropic` | `gemini`) with **no
code changes** required to switch.

## Project Structure

```
chess-IA/
├── frontend/        # Vite + React + TS + Tailwind + i18next
│   └── src/
│       ├── components/   ChessBoard, ChatPanel, AnalysisBar, GameControls, LanguageSwitcher
│       ├── hooks/        useChessGame, useChat
│       ├── services/     api.ts
│       └── i18n/         locales/en.json, locales/pt-BR.json
└── backend/         # FastAPI
    └── app/
        ├── main.py
        ├── routers/      chat.py, analysis.py
        ├── services/     stockfish_service.py, llm/ (adapters + factory)
        └── models/       chat.py, analysis.py
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (3.11+ recommended)
- **Stockfish** engine binary (see below)

### Install the Stockfish binary

- **Windows:** download from <https://stockfishchess.org/download/>, unzip, and
  point `STOCKFISH_PATH` at the `.exe`
  (e.g. `C:\tools\stockfish\stockfish-windows-x86-64-avx2.exe`).
- **Ubuntu/Debian:** `sudo apt install stockfish` (binary at `/usr/games/stockfish`).
- **macOS:** `brew install stockfish`.

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\Activate.ps1
# Unix:     source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # then edit .env (Windows: copy .env.example .env)
```

Edit `backend/.env`:
- set `LLM_PROVIDER` and the matching API key,
- set `STOCKFISH_PATH` to your Stockfish binary.

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: <http://localhost:8000/api/health> · Docs: <http://localhost:8000/docs>

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to the
backend on port 8000.

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list (LLM
provider + keys, optional model overrides, Stockfish path/depth, ports, and
`FRONTEND_URL` used for CORS).

## Roadmap

- **Phase 1** — Project scaffold ✅
- **Phase 2** — Backend core (models, Stockfish service, LLM adapters, endpoints)
- **Phase 3** — Frontend core (board, chat, controls, analysis bar, language switcher)
- **Phase 4** — i18n strings (en / pt-BR)
- **Phase 5** — Polish (typing indicator, responsive layout, last-move highlight, error handling)

[react-chessboard]: https://github.com/Clariity/react-chessboard
[chess.js]: https://github.com/jhlywa/chess.js
