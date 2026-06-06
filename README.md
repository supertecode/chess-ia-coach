# Chess AI Assistant

**[🇧🇷 Português](#-português) · [🇬🇧 English](#-english)**

Ambiente de estudo de xadrez com um consultor de IA. Jogue e estude em um
tabuleiro interativo, carregue partidas via PGN/FEN, receba análise em tempo real
do motor **Stockfish** e converse com um **LLM** que explica lances, planos e
ideias — com os lances recomendados desenhados como setas no tabuleiro.
Interface bilíngue (**pt-BR / en**).

> A study chess environment with an AI consultant. Play and study on an
> interactive board, load games via PGN/FEN, get real-time **Stockfish**
> analysis, and chat with an **LLM** coach that explains moves, plans and ideas —
> with recommended moves drawn as arrows on the board. Bilingual UI
> (**pt-BR / en**).

---

## 🇧🇷 Português

### Funcionalidades

- ♟️ Tabuleiro interativo com **arrastar** e **clicar-para-mover** (preview de lances legais)
- 👑 **Promoção de peão** com escolha entre Dama / Torre / Bispo / Cavalo
- 🧠 Análise automática em tempo real com **Stockfish** + barra de avaliação
- 💡 Botão para **mostrar/ocultar** a seta do melhor lance do motor
- 💬 **Chat com IA** (treinador) com 3 modos: 🏃 Rápido, 📖 Completa, 🤔 Socrático
- 📝 Respostas do chat renderizadas em **Markdown**
- 🔌 **Troca de provedor LLM por `.env`** (Groq, OpenAI, Anthropic, Gemini) — sem mudar código
- ⏮️ **Histórico navegável** (clique nos lances, setas ◀ ▶ e teclado ← →)
- 🖱️ **Painéis redimensionáveis** (arraste os divisores; as larguras persistem)
- 🌐 Interface **bilíngue** (pt-BR / en) com persistência da escolha

### Stack

**Frontend:** React 19 + TypeScript (Vite), `react-chessboard` v5, `chess.js`,
i18next, Tailwind CSS v4, `react-markdown`.
**Backend:** Python (FastAPI assíncrono), biblioteca `stockfish`, `httpx`,
`pydantic`. Integração com LLM via **padrão Adapter** selecionado por `.env`.

### Estrutura

```
chess-IA/
├── frontend/        # React + TS + Tailwind + i18next
│   ├── src/
│   │   ├── components/   ChessBoard, ChatPanel, AnalysisBar, GameControls,
│   │   │                 LanguageSwitcher, MoveHistory, ModeSelector,
│   │   │                 PromotionDialog, ResizeDivider, Modal
│   │   ├── hooks/        useChessGame, useChat, useAnalysis,
│   │   │                 useSquareSize, usePanelResize
│   │   ├── services/     api.ts
│   │   ├── config/       layoutConfig.ts
│   │   └── i18n/         locales/en.json, locales/pt-BR.json
│   └── requirements.txt # referência (instale com: npm install)
├── backend/         # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/      chat.py, analysis.py
│   │   ├── services/     stockfish_service.py, llm/ (adapters + factory)
│   │   └── models/       chat.py, analysis.py, common.py
│   └── requirements.txt
├── docs/            # documentação adicional
└── start-dev.cmd / start-dev.ps1   # sobem backend + frontend
```

### Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.10+ (3.11+ recomendado)
- Binário do **Stockfish**

#### Instalar o Stockfish
- **Windows:** baixe em <https://stockfishchess.org/download/>, descompacte e
  aponte `STOCKFISH_PATH` para o `.exe`.
- **Ubuntu/Debian:** `sudo apt install stockfish`
- **macOS:** `brew install stockfish`

### Instalação

**1. Backend**
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\Activate.ps1
# Unix:     source .venv/bin/activate
pip install -r requirements.txt

copy .env.example .env   # Windows  (Unix: cp .env.example .env)
```
Edite `backend/.env`: defina `LLM_PROVIDER` + a chave correspondente e
`STOCKFISH_PATH`.

**2. Frontend**
```bash
cd frontend
npm install
```

### Como rodar

**Opção A — script (Windows):** dê duplo-clique em **`start-dev.cmd`** (sobe
backend na 8000 e frontend na 5173 em janelas separadas).

**Opção B — manual (dois terminais):**
```bash
# Terminal 1 (backend)
cd backend && uvicorn app.main:app --reload --port 8000
# Terminal 2 (frontend)
cd frontend && npm run dev
```
Abra <http://localhost:5173>. O Vite faz proxy de `/api` para o backend.

### Variáveis de ambiente

Veja [`backend/.env.example`](backend/.env.example). Principais:
`LLM_PROVIDER` (`groq` | `openai` | `anthropic` | `gemini`) + a chave
correspondente; overrides de modelo (ex.: `GEMINI_MODEL=gemini-2.5-flash`);
`STOCKFISH_PATH`, `STOCKFISH_DEFAULT_DEPTH`; `BACKEND_PORT`, `FRONTEND_URL`.

### Documentação adicional

- [docs/contexto-e-memoria-do-chat.md](docs/contexto-e-memoria-do-chat.md) — como
  o chat lida com contexto e memória.

---

## 🇬🇧 English

### Features

- ♟️ Interactive board with **drag** and **click-to-move** (legal-move preview)
- 👑 **Pawn promotion** with a Queen / Rook / Bishop / Knight picker
- 🧠 Real-time auto-analysis with **Stockfish** + evaluation bar
- 💡 Button to **show/hide** the engine's best-move arrow
- 💬 **AI chat** coach with 3 modes: 🏃 Quick, 📖 Full, 🤔 Socratic
- 📝 Chat replies rendered as **Markdown**
- 🔌 **Swap LLM provider via `.env`** (Groq, OpenAI, Anthropic, Gemini) — no code changes
- ⏮️ **Navigable move history** (click moves, ◀ ▶ buttons, ← → keys)
- 🖱️ **Resizable panels** (drag the dividers; widths persist)
- 🌐 **Bilingual** UI (pt-BR / en) with persisted choice

### Stack

**Frontend:** React 19 + TypeScript (Vite), `react-chessboard` v5, `chess.js`,
i18next, Tailwind CSS v4, `react-markdown`.
**Backend:** Python (async FastAPI), `stockfish` library, `httpx`, `pydantic`.
LLM integration uses an **Adapter pattern** selected via `.env`.

### Project structure

See the tree in the Portuguese section above — file/folder names are identical.

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (3.11+ recommended)
- The **Stockfish** binary

#### Install Stockfish
- **Windows:** download from <https://stockfishchess.org/download/>, unzip and
  point `STOCKFISH_PATH` at the `.exe`.
- **Ubuntu/Debian:** `sudo apt install stockfish`
- **macOS:** `brew install stockfish`

### Installation

**1. Backend**
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\Activate.ps1
# Unix:     source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env     # Windows: copy .env.example .env
```
Edit `backend/.env`: set `LLM_PROVIDER` + the matching API key and
`STOCKFISH_PATH`.

**2. Frontend**
```bash
cd frontend
npm install
```

### Running

**Option A — script (Windows):** double-click **`start-dev.cmd`** (starts the
backend on 8000 and the frontend on 5173 in separate windows).

**Option B — manual (two terminals):**
```bash
# Terminal 1 (backend)
cd backend && uvicorn app.main:app --reload --port 8000
# Terminal 2 (frontend)
cd frontend && npm run dev
```
Open <http://localhost:5173>. Vite proxies `/api` to the backend.

### Environment variables

See [`backend/.env.example`](backend/.env.example). Key ones: `LLM_PROVIDER`
(`groq` | `openai` | `anthropic` | `gemini`) + the matching key; optional model
overrides (e.g. `GEMINI_MODEL=gemini-2.5-flash`); `STOCKFISH_PATH`,
`STOCKFISH_DEFAULT_DEPTH`; `BACKEND_PORT`, `FRONTEND_URL`.

### Extra docs

- [docs/contexto-e-memoria-do-chat.md](docs/contexto-e-memoria-do-chat.md) — how
  the chat handles context and memory (in Portuguese).
