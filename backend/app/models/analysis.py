"""Schemas for the /api/analysis endpoint."""

from pydantic import BaseModel, Field

from .common import Arrow, Score


class AnalysisRequest(BaseModel):
    fen: str = Field(..., description="Position in Forsyth-Edwards Notation")
    depth: int = Field(default=15, ge=1, le=30, description="Search depth")

    # Reserved for a future auth/user layer (kept optional by design).
    user_id: str | None = None


class MoveScore(BaseModel):
    move: str
    score: int


class AnalysisResponse(BaseModel):
    best_move: str | None
    score: Score
    top_moves: list[MoveScore]
    arrows: list[Arrow]
