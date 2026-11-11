import logging
import sys
from datetime import datetime, timezone

from app.core.config import settings


def setup_logging() -> None:
    level = logging.DEBUG if settings.app_debug else logging.INFO
    formatter = logging.Formatter(
        fmt="%(asctime)s.%(msecs)03dZ [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    formatter.converter = lambda _: datetime.now(timezone.utc).timetuple()

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    logging.getLogger("passlib").setLevel(logging.ERROR)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING if not settings.app_debug else logging.INFO)
