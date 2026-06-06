"""Small chess-notation helpers shared by services and routers."""

import re

from app.models.common import Arrow

# UCI long algebraic move, e.g. "e2e4" or "e7e8q" (promotion).
_UCI_RE = re.compile(r"^([a-h][1-8])([a-h][1-8])([qrbn])?$")


def uci_to_arrow(uci: str | None, color: str = "#00ff88") -> Arrow | None:
    """Convert a UCI move into a board Arrow.

    Returns None when `uci` is missing or not in UCI form (e.g. SAN like
    "Nf5"), so callers can safely skip drawing an arrow.
    """
    if not uci:
        return None
    match = _UCI_RE.match(uci.strip())
    if not match:
        return None
    from_sq, to_sq, _promotion = match.groups()
    return Arrow(**{"from": from_sq, "to": to_sq, "color": color})
