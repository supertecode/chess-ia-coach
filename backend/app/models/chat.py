"""Schemas for the /api/chat endpoint."""

from typing import Literal

from pydantic import BaseModel, Field

from .common import Arrow, Score


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatAnalysisContext(BaseModel):
    """Optional engine context the frontend attaches to a chat turn."""

    best_move: str | None = None
    score: Score | None = None


class ChatRequest(BaseModel):
    message: str
    fen: str | None = None
    analysis: ChatAnalysisContext | None = None
    history: list[ChatMessage] = Field(default_factory=list)
    language: str = "en"

    # Reserved for a future auth/user layer (kept optional by design).
    user_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    arrows: list[Arrow] = Field(default_factory=list)
