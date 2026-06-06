"""Thin async wrapper around the Stockfish engine.

The underlying `stockfish` package talks to the engine over a single subprocess
pipe, which is not safe for concurrent access. We therefore serialize calls with
an asyncio lock and run the (blocking) engine work in a threadpool so the event
loop stays responsive.
"""

import asyncio
import os
import shutil

from fastapi.concurrency import run_in_threadpool

from app.config import get_settings
from app.exceptions import InvalidFENError, StockfishUnavailableError
from app.models.analysis import AnalysisResponse, MoveScore
from app.models.common import Score
from app.services.chess_utils import uci_to_arrow

# Color for the engine's best-move arrow (matches the frontend accent).
BEST_MOVE_COLOR = "#00ff88"

# Cap used to convert a forced mate into a comparable centipawn-like number.
_MATE_CP = 100_000


def _validate_fen(fen: str) -> None:
    """Cheap structural FEN check to reject obvious garbage before the engine."""
    parts = fen.strip().split()
    if len(parts) < 2:
        raise InvalidFENError()
    ranks = parts[0].split("/")
    if len(ranks) != 8:
        raise InvalidFENError()
    for rank in ranks:
        count = 0
        for ch in rank:
            if ch.isdigit():
                count += int(ch)
            elif ch.lower() in "pnbrqk":
                count += 1
            else:
                raise InvalidFENError()
        if count != 8:
            raise InvalidFENError()
    if parts[1] not in ("w", "b"):
        raise InvalidFENError()


def _mate_to_cp(mate: int) -> int:
    """Map 'mate in N' to a signed, comparable centipawn-like value."""
    return (1 if mate >= 0 else -1) * (_MATE_CP - abs(mate))


class StockfishService:
    def __init__(self, path: str, default_depth: int):
        self._default_depth = default_depth
        self._lock = asyncio.Lock()

        # Resolve the binary up front so a bad path fails cleanly, instead of
        # letting the stockfish package raise mid-construction (which triggers
        # a noisy AttributeError in its __del__).
        resolved = path if os.path.isfile(path) else shutil.which(path)
        if not resolved:
            raise StockfishUnavailableError(
                f"Stockfish binary not found at '{path}'. "
                "Set STOCKFISH_PATH in your .env."
            )

        try:
            from stockfish import Stockfish

            self._engine = Stockfish(path=resolved, depth=default_depth)
            # Touch the engine once so a bad path fails fast and clearly.
            self._engine.get_parameters()
        except Exception as exc:  # noqa: BLE001
            raise StockfishUnavailableError(
                f"Could not start Stockfish at '{path}': {exc}"
            ) from exc

    async def analyze(self, fen: str, depth: int | None = None) -> AnalysisResponse:
        _validate_fen(fen)
        target_depth = depth or self._default_depth
        async with self._lock:
            return await run_in_threadpool(self._analyze_sync, fen, target_depth)

    def _analyze_sync(self, fen: str, depth: int) -> AnalysisResponse:
        try:
            self._engine.set_depth(depth)
            self._engine.set_fen_position(fen)

            raw_eval = self._engine.get_evaluation()  # {"type","value"}
            best_move = self._engine.get_best_move()
            raw_top = self._engine.get_top_moves(3)
        except InvalidFENError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise StockfishUnavailableError(
                f"Stockfish analysis failed: {exc}"
            ) from exc

        score = Score(type=raw_eval.get("type", "cp"), value=raw_eval.get("value", 0))

        top_moves: list[MoveScore] = []
        for entry in raw_top:
            move = entry.get("Move")
            if not move:
                continue
            cp = entry.get("Centipawn")
            mate = entry.get("Mate")
            value = cp if cp is not None else (_mate_to_cp(mate) if mate is not None else 0)
            top_moves.append(MoveScore(move=move, score=value))

        arrow = uci_to_arrow(best_move, BEST_MOVE_COLOR)
        return AnalysisResponse(
            best_move=best_move,
            score=score,
            top_moves=top_moves,
            arrows=[arrow] if arrow else [],
        )


_service: StockfishService | None = None


def get_stockfish_service() -> StockfishService:
    """Lazily build and cache the engine singleton."""
    global _service
    if _service is None:
        settings = get_settings()
        _service = StockfishService(
            settings.stockfish_path, settings.stockfish_default_depth
        )
    return _service
