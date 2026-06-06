"""POST /api/chat — LLM chess-coach conversation."""

from fastapi import APIRouter

from app.models.chat import ChatRequest, ChatResponse
from app.models.common import ErrorResponse
from app.services.chess_utils import uci_to_arrow
from app.services.llm.factory import get_llm_adapter
from app.services.llm.prompts import build_system_prompt

router = APIRouter(prefix="/api", tags=["chat"])

# Arrow color for the move the coach recommends (warm/orange accent).
COACH_ARROW_COLOR = "#ffaa00"


def _build_messages(request: ChatRequest) -> list[dict]:
    """Assemble OpenAI-style messages: system prompt + history + context turn."""
    best_move = request.analysis.best_move if request.analysis else None
    messages: list[dict] = [
        {
            "role": "system",
            "content": build_system_prompt(request.mode, request.language, best_move),
        }
    ]
    for turn in request.history:
        messages.append({"role": turn.role, "content": turn.content})

    context_lines: list[str] = []
    if request.fen:
        context_lines.append(f"Current position (FEN): {request.fen}")
    if request.analysis:
        if request.analysis.best_move:
            context_lines.append(f"Engine best move: {request.analysis.best_move}")
        if request.analysis.score:
            score = request.analysis.score
            context_lines.append(f"Engine evaluation: {score.type} {score.value}")

    context_block = "\n".join(context_lines)
    user_content = (
        f"{context_block}\n\nQuestion: {request.message}"
        if context_block
        else request.message
    )
    messages.append({"role": "user", "content": user_content})
    return messages


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={502: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def chat(request: ChatRequest) -> ChatResponse:
    adapter = get_llm_adapter()
    messages = _build_messages(request)
    reply = await adapter.chat(messages)

    # MVP heuristic: if the engine's best move (UCI) was provided as context,
    # echo it as an arrow so the recommendation is visible on the board.
    arrows = []
    if request.analysis and request.analysis.best_move:
        arrow = uci_to_arrow(request.analysis.best_move, COACH_ARROW_COLOR)
        if arrow:
            arrows.append(arrow)

    return ChatResponse(reply=reply, arrows=arrows)
