"""Shared Pydantic schemas used across analysis and chat."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Score(BaseModel):
    """Engine evaluation. `cp` = centipawns, `mate` = mate in N (signed)."""

    type: Literal["cp", "mate"]
    value: int


class Arrow(BaseModel):
    """A board arrow. Serialized with `from`/`to` keys to match the frontend.

    `from` is a Python keyword, so the fields are aliased.
    """

    model_config = ConfigDict(populate_by_name=True)

    from_square: str = Field(alias="from")
    to_square: str = Field(alias="to")
    color: str = "#00ff88"


class ErrorResponse(BaseModel):
    """Structured error returned by every endpoint on failure."""

    error: str
    code: str
