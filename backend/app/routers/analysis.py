"""POST /api/analysis — Stockfish position analysis."""

from fastapi import APIRouter

from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.models.common import ErrorResponse
from app.services.stockfish_service import get_stockfish_service

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post(
    "/analysis",
    response_model=AnalysisResponse,
    responses={422: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def analyze_position(request: AnalysisRequest) -> AnalysisResponse:
    service = get_stockfish_service()
    return await service.analyze(request.fen, request.depth)
