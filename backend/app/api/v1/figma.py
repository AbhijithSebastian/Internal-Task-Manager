import logging
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

FIGMA_API = "https://api.figma.com"


@router.get("/files/{file_key}")
async def get_figma_file(file_key: str, request: Request):
    headers = {"User-Agent": "ProjectWorkspace/1.0"}
    auth = request.headers.get("Authorization")
    if auth:
        token = auth.replace("Bearer ", "", 1)
        if token.strip():
            headers["X-Figma-Token"] = token

    url = f"{FIGMA_API}/v1/files/{file_key}"

    logger.info(
        "Figma proxy request: method=GET url=%s has_auth=%s",
        url, "yes" if auth else "no",
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers)

    logger.info(
        "Figma proxy response: url=%s status=%d body=%s",
        url, resp.status_code, resp.text,
    )

    try:
        body = resp.json()
    except Exception:
        body = {"message": resp.text}

    return JSONResponse(
        status_code=resp.status_code,
        content=body,
    )
