# Chess AI Assistant — Prompt de Modificações v2

> Cole este prompt no Claude Code para aplicar todas as melhorias acordadas.
> O prompt está em inglês para maximizar a qualidade de resposta do modelo.

---

## PROMPT

```
I need you to apply a series of improvements to the existing Chess AI Assistant project. Read all requirements carefully before making any changes. Implement them in the order specified, confirming each phase before proceeding.

---

## PHASE 1 — LAYOUT REFACTOR (Full-height 3-column layout)

### Goal
Fix the broken layout. The app must fit entirely within the viewport height (`100vh`) with no vertical overflow on the main container. All scrolling must be contained within specific panels.

### New Layout Structure
Implement a **3-column fixed layout** using CSS Flexbox or Grid:

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LEFT PANEL    │    CENTER PANEL      │   RIGHT PANEL   │
│   (280px fixed) │    (flex: 1)         │   (340px fixed) │
│                 │                      │                 │
│ • Game Controls │ • Chessboard         │ • Chat header   │
│ • Load FEN      │   (square, centered) │   (mode select) │
│ • Load PGN btn  │ • Eval bar           │ • Messages area │
│ • Move History  │ • Nav buttons ◀ ▶   │   (scrollable)  │
│   (scrollable)  │                      │ • Input box     │
└─────────────────┴──────────────────────┴─────────────────┘
```

### Rules
- Root container: `display: flex; height: 100vh; overflow: hidden`
- Each column: `height: 100%; overflow: hidden`
- The chessboard must remain **square** and **centered** — use `aspect-ratio: 1/1` and let it size based on available height, not width
- Left panel inner content: `overflow-y: auto` (scrollable move list)
- Right panel messages area: `overflow-y: auto; flex: 1` (scrollable chat)
- Right panel input box: always pinned to the bottom of the right panel
- Header bar spans full width above the 3 columns (logo, language switcher, etc.)

### PGN Input → Modal
The PGN textarea input must be moved into a **modal dialog** (since PGN strings are long):
- In the left panel, show a button "Load PGN" that opens the modal
- The modal contains: a large textarea, a "Load" confirm button, and a close/cancel button
- FEN input stays inline in the left panel (short strings, fits fine)
- Use a simple modal implementation (no external modal library needed — a conditional render with a backdrop overlay is sufficient)

---

## PHASE 2 — NAVIGABLE MOVE HISTORY

### Goal
Allow the user to navigate through the game move by move, clicking on any past move to jump to that position.

### Changes to `useChessGame.ts` hook
- Add a `history` state: an array of objects `{ san: string, fen: string, moveNumber: number, color: 'w' | 'b' }`
- Add a `currentIndex` state (pointer into the history array)
- On every valid move, push `{ san, fen, moveNumber, color }` to history and advance `currentIndex`
- Add functions:
  - `goToMove(index: number)` — loads the FEN at that index, updates `currentIndex`
  - `goBack()` — `goToMove(currentIndex - 1)`
  - `goForward()` — `goToMove(currentIndex + 1)`
  - `goToStart()` — loads the initial FEN
  - `goToEnd()` — loads the last FEN in history
- When navigating to a past position: the board shows that position but **does not allow new moves** (read-only when `currentIndex < history.length - 1`). Navigating to the last move re-enables play.

### New `MoveHistory` Component
Create `src/components/MoveHistory/MoveHistory.tsx`:
- Renders moves in **algebraic notation pairs**: `1. e4 e5  2. Nf3 Nc6 ...`
- Each individual move (SAN token) is a **clickable element** — clicking calls `goToMove(index)`
- The currently viewed move is **highlighted** (distinct background color)
- The component is scrollable and **auto-scrolls** to keep the current move visible (`useEffect` + `scrollIntoView`)
- Below the move list, render 4 navigation buttons: `|◀  ◀  ▶  ▶|` (go to start, back, forward, go to end)

### Keyboard Navigation
Add a `keydown` event listener (on `window`) for:
- `ArrowLeft` → `goBack()`
- `ArrowRight` → `goForward()`

---

## PHASE 3 — LLM RESPONSE MODES

### Goal
Add 3 distinct LLM coaching modes that change the system prompt and response style. The selected mode is sent with every `/api/chat` request.

### Frontend Changes

**New `ModeSelector` component** (renders in the right panel header, above chat messages):
- A segmented control / tab group with 3 options:
  - 🏃 **Quick Coach** (Coach Rápido)
  - 📖 **Full Analysis** (Análise Completa)  
  - 🤔 **Socratic** (Socrático)
- Selected mode stored in React state, persisted in `localStorage`
- The active mode is sent as a `mode: "quick" | "full" | "socratic"` field in the `/api/chat` request body

### Backend Changes

In `app/routers/chat.py`, update the `ChatRequest` Pydantic model:
```python
class ChatRequest(BaseModel):
    message: str
    fen: str
    analysis: dict | None = None
    history: list[dict] = []
    language: str = "pt-BR"
    mode: str = "full"  # "quick" | "full" | "socratic"
```

In `app/services/llm/prompts.py` (create this file), define 3 system prompt templates:

**QUICK mode:**
```
You are a chess coach giving rapid feedback. Be extremely concise.
For every position analysis, respond in exactly this structure:
- One sentence identifying the position type or key tension
- Best move: [MOVE] — one sentence explaining why
- Watch out for: one concrete threat or tactic to be aware of

Maximum 4 lines total. No headers. No bullet sub-points. Be direct.
Always respond in: {language}
```

**FULL mode:**
```
You are an expert chess coach and analyst. When analyzing a position, always structure your response in Markdown with these exact sections:

## Position Overview
Brief description of the pawn structure, piece activity, and key imbalances.

## Why [BEST_MOVE] is Strong
Explain the move's purpose: tactical, strategic, or both. Reference specific squares and pieces.

## Short-Term Plan
3 to 5 bullet points outlining the plan for the side to move over the next few moves.

## Watch Out For
One concrete threat or counter-idea the opponent might have.

Use **bold** for move names and key concepts. Use standard algebraic notation.
Always respond in: {language}
```

**SOCRATIC mode:**
```
You are a Socratic chess coach. Your job is NOT to give answers — it is to guide the student to find the answer themselves through questions.

When asked about a position:
1. Acknowledge the position briefly (1 sentence)
2. Ask 2 or 3 targeted questions that lead the student toward the key idea. Examples: "Which of your pieces is the least active right now?", "What would happen if your opponent played X?", "Is your king safe enough to start an attack?"
3. End with: "Take a moment to think, then tell me what you find." 

Only reveal the answer if the user explicitly asks "show me the answer" or "reveal" or similar.
Always respond in: {language}
```

In `app/routers/chat.py`, select the system prompt based on `request.mode` and inject `{language}` and `{BEST_MOVE}` (from the analysis field) before sending to the LLM adapter.

---

## PHASE 4 — MARKDOWN RENDERING IN CHAT

### Goal
Render LLM responses as formatted Markdown (headers, bold, bullet lists) instead of raw text.

### Dependencies to add (frontend)
```bash
npm install react-markdown remark-gfm
```

### Changes to `ChatMessage` component
- Import `ReactMarkdown` from `react-markdown` and `remarkGfm` from `remark-gfm`
- For messages where `role === "assistant"`, wrap content in:
```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {message.content}
</ReactMarkdown>
```
- For messages where `role === "user"`, keep plain text rendering
- Add CSS for the markdown content inside chat bubbles:
  - `h2`: slightly larger font, bold, margin-bottom: 4px, border-bottom: 1px solid (subtle)
  - `ul`, `ol`: left padding, normal list style
  - `li`: margin-bottom: 4px
  - `strong`: use the accent color (green or gold, matching the theme)
  - `p`: margin-bottom: 8px, no margin on last-child
  - Keep all text within the bubble's max-width — no overflow

### Typing Indicator
While waiting for the LLM response, show a typing indicator in the chat:
- Render a placeholder bubble with 3 animated dots (CSS pulse/bounce animation)
- Remove it and replace with the real message once the response arrives

---

## PHASE 5 — WIRING & CLEANUP

1. **Analysis auto-trigger**: After every player move, automatically call `POST /api/analysis` and update the arrows + eval bar. Do not require the user to click a button for this.

2. **Context in chat**: When the user sends a chat message, always include in the request:
   - `fen`: the current board FEN (even when browsing history — use the FEN at `currentIndex`)
   - `analysis`: the last Stockfish analysis result for that position (or null if not yet analyzed)
   - `mode`: the currently selected LLM mode

3. **Clear chat on new game**: When "New Game" is clicked, reset the chat history state to only the initial greeting message.

4. **i18n strings to add** for the new UI elements (add to both `en.json` and `pt-BR.json`):
   - Mode selector labels: Quick Coach / Coach Rápido, Full Analysis / Análise Completa, Socratic / Socrático
   - Modal: "Load PGN" button, "Confirm" / "Cancel"
   - Navigation buttons tooltips
   - Typing indicator text: "Thinking..." / "Analisando..."
   - Read-only board notice: "Browsing history — go to last move to play" / "Navegando no histórico — vá ao último lance para jogar"

5. **Remove** any leftover inline styles or hardcoded heights that cause layout overflow.

---

Implement Phase 1 first and show me the updated layout before proceeding to Phase 2.
```

---

## NOTAS DE USO

- **Ordem importa:** Peça ao Claude Code para implementar fase por fase. O layout (Phase 1) deve estar correto antes de adicionar o histórico.
- **react-markdown:** Se o Claude Code usar uma versão antiga da lib, a API pode ser diferente. A versão correta é `react-markdown@^9` com `remark-gfm@^4`.
- **Modo Socrático:** Se quiser testar isoladamente, mude o `localStorage` no DevTools: `localStorage.setItem('llmMode', 'socratic')` e recarregue.
- **Auto-análise (Phase 5):** Isso vai gerar uma chamada ao backend a cada lance jogado. Se o Stockfish estiver lento, considere adicionar um debounce de 300ms ou um indicador de loading na eval bar.
