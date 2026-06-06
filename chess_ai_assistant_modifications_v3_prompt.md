# Chess AI Assistant — Prompt de Modificações v3

> Cole este prompt no Claude Code para aplicar as melhorias de interação com o tabuleiro.

---

## PROMPT

```
Apply the following 3 improvements to the Chess AI Assistant project. Read all requirements before touching any file. Implement in order and confirm each phase.

---

## PHASE 1 — PAWN PROMOTION: ALL PIECES

### Problem
Currently pawn promotion is hardcoded to queen only. The user must be able to choose between all 4 valid promotion pieces.

### Solution
Use `react-chessboard`'s built-in promotion dialog. Check the installed version's props and use the native approach if available:

**If `promotionDialogVariant` prop exists (react-chessboard >= 4.x):**
```tsx
<Chessboard
  ...
  promotionDialogVariant="modal"
  onPromotionPieceSelect={(piece, fromSquare, toSquare) => {
    // piece arrives as "wQ", "wR", "wB", "wN" (or "b" prefix for black)
    // extract the piece type: piece[1].toLowerCase() → "q" | "r" | "b" | "n"
    handlePromotion(fromSquare, toSquare, piece[1].toLowerCase());
  }}
/>
```

**If the built-in dialog is unavailable or unstyled (fallback):**
Build a custom promotion modal:
- Trigger: detect when a pawn move would reach rank 8 (white) or rank 1 (black) — check with `chess.js` before calling `chess.move()`
- Detection logic:
```ts
const isPawnPromotion = (from: Square, to: Square): boolean => {
  const piece = game.get(from);
  return (
    piece?.type === 'p' &&
    ((piece.color === 'w' && to[1] === '8') ||
     (piece.color === 'b' && to[1] === '1'))
  );
};
```
- When promotion is detected: store `pendingPromotion: { from, to }` in state and open the modal — do NOT call `chess.move()` yet
- Modal design:
  - Centered overlay with dark semi-transparent backdrop
  - Title: "Promote pawn" / "Promover peão" (i18n)
  - 4 piece buttons in a horizontal row: ♛ Queen / ♜ Rook / ♝ Bishop / ♞ Knight
  - Use the same chess piece SVGs already in the project (or unicode fallback: ♛♜♝♞ for white, ♛♜♝♞ for black)
  - On piece click: call `chess.move({ from, to, promotion: selectedPiece })`, clear `pendingPromotion`, close modal
  - On backdrop click or ESC key: cancel the move, clear `pendingPromotion`
  - The 4 buttons must be large enough to tap on mobile (min 60×60px)

### i18n keys to add
```json
// en.json
"promotion.title": "Promote pawn",
"promotion.queen": "Queen",
"promotion.rook": "Rook",
"promotion.bishop": "Bishop",
"promotion.knight": "Knight"

// pt-BR.json
"promotion.title": "Promover peão",
"promotion.queen": "Dama",
"promotion.rook": "Torre",
"promotion.bishop": "Bispo",
"promotion.knight": "Cavalo"
```

---

## PHASE 2 — LEGAL MOVE PREVIEW (click to highlight)

### Goal
When the user clicks a piece, highlight all squares that piece can legally move to — identical to Lichess/Chess.com behavior.

### Implementation in `useChessGame.ts`
Add the following state and logic:

```ts
const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({});

const onSquareClick = (square: Square) => {
  // If a piece is already selected and this square is a legal destination → move
  if (selectedSquare && legalMoveSquares[square]) {
    handleMove(selectedSquare, square);
    setSelectedSquare(null);
    setLegalMoveSquares({});
    return;
  }

  // If clicking own piece → select it and show legal moves
  const piece = game.get(square);
  if (piece && piece.color === game.turn()) {
    const moves = game.moves({ square, verbose: true });
    const highlights: Record<string, React.CSSProperties> = {};

    // Highlight the selected piece's square
    highlights[square] = {
      backgroundColor: 'rgba(255, 255, 100, 0.4)',
    };

    moves.forEach(move => {
      const isCapture = !!game.get(move.to);
      highlights[move.to] = isCapture
        ? {
            // Capture square: colored ring/border effect
            boxShadow: 'inset 0 0 0 4px rgba(255, 100, 100, 0.7)',
            borderRadius: '2px',
          }
        : {
            // Empty square: centered dot
            background:
              'radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 26%)',
            borderRadius: '50%',
          };
    });

    setSelectedSquare(square);
    setLegalMoveSquares(highlights);
    return;
  }

  // Clicking elsewhere → deselect
  setSelectedSquare(null);
  setLegalMoveSquares({});
};
```

### Wiring to the board component
Pass to `<Chessboard>`:
```tsx
<Chessboard
  ...
  onSquareClick={onSquareClick}
  customSquareStyles={legalMoveSquares}
/>
```

### Interaction rules
- Clicking an already-selected piece deselects it (clears highlights)
- After a move is made (drag OR click-to-move), always clear `selectedSquare` and `legalMoveSquares`
- In **history browsing mode** (`currentIndex < history.length - 1`): disable selection entirely — do not show highlights on click
- Drag-and-drop must still work normally alongside click-to-move

---

## PHASE 3 — BEST MOVE PREVIEW TOGGLE

### Goal
Add a toggle button in the board header that shows/hides the Stockfish best move arrow on the board. The arrow only appears when: (a) the toggle is ON and (b) a Stockfish analysis result is available for the current position.

### Toggle button placement
In the **board header** (the bar directly above the chessboard), add a toggle button on the right side:

- Icon: 💡 (lightbulb) — use a Lucide icon (`Lightbulb` from `lucide-react`) or a Unicode fallback
- When OFF: icon is dimmed (opacity 0.4), tooltip "Show best move" / "Mostrar melhor lance"
- When ON: icon is fully bright with a subtle highlight/glow, tooltip "Hide best move" / "Ocultar melhor lance"
- State: `showBestMove` boolean, stored in `localStorage` key `"showBestMove"`, default `false`

### Arrow rendering logic
In the board component, compute `customArrows` as follows:

```ts
const boardArrows = useMemo(() => {
  const arrows: [Square, Square, string?][] = [];

  // Best move arrow (only when toggle is ON and analysis exists)
  if (showBestMove && currentAnalysis?.best_move) {
    const from = currentAnalysis.best_move.slice(0, 2) as Square;
    const to = currentAnalysis.best_move.slice(2, 4) as Square;
    arrows.push([from, to, '#00cc66']); // bright green
  }

  // Last move arrow (always shown)
  if (lastMove) {
    arrows.push([lastMove.from, lastMove.to, 'rgba(255,255,100,0.6)']);
  }

  return arrows;
}, [showBestMove, currentAnalysis, lastMove]);
```

Pass to `<Chessboard customArrows={boardArrows} />`.

### State to add in `useChessGame.ts`
```ts
const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
```
Update `lastMove` on every successful move.

### `currentAnalysis` availability
- `currentAnalysis` is the last result returned by `POST /api/analysis` for the FEN currently displayed
- When the user navigates history, the analysis corresponds to that position's FEN (may be null if not yet analyzed)
- When `showBestMove` is toggled ON and `currentAnalysis` is null for the current position, trigger a new `/api/analysis` call automatically

### i18n keys to add
```json
// en.json
"board.showBestMove": "Show best move",
"board.hideBestMove": "Hide best move"

// pt-BR.json
"board.showBestMove": "Mostrar melhor lance",
"board.hideBestMove": "Ocultar melhor lance"
```

---

## GENERAL RULES

1. Do not break any existing functionality (move history navigation, chat, eval bar, language switcher).
2. All new UI elements must respect the existing dark theme color palette.
3. Do not add any new npm dependencies beyond what is already installed — all 3 features are achievable with `chess.js`, `react-chessboard`, and `lucide-react` (already present).
4. After each phase, briefly describe what was changed and which files were modified.

---

Start with Phase 1. Confirm when done before proceeding to Phase 2.
```

---

## NOTAS DE USO

- **Promoção nativa vs. custom:** O prompt tenta usar o `promotionDialogVariant` nativo primeiro. Se o Claude Code reportar que a prop não existe na versão instalada, peça para ele usar o fallback customizado — ambos os caminhos estão descritos.
- **Click-to-move + drag:** Os dois modos coexistem. O `onSquareClick` lida com click-to-move; o `onPieceDrop` existente continua lidando com drag. Certifique-se que ambos chamam a mesma função `handleMove` e limpam o `selectedSquare` depois.
- **`lucide-react`:** Se não estiver instalado no projeto, o Claude Code vai instalar. Se preferir evitar, o prompt autoriza fallback unicode (💡).
- **Seta de último lance:** Foi incluída junto à seta de melhor lance para não regredir o comportamento atual — o tabuleiro já mostrava a seta do Stockfish; agora ela passa a ser controlada pelo toggle, e a seta amarela do último lance fica sempre visível.
