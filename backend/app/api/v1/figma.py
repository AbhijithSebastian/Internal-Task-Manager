import logging
import httpx
from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse, Response

logger = logging.getLogger(__name__)

router = APIRouter()

FIGMA_API = "https://api.figma.com"


def _get_figma_token(token: str | None, request: Request) -> str | None:
    figma_token = token
    if not figma_token:
        auth = request.headers.get("Authorization")
        if auth:
            figma_token = auth.replace("Bearer ", "", 1).strip()
    return figma_token


@router.get("/files/{file_key}")
async def get_figma_file(
    file_key: str,
    request: Request,
    token: str = Query(None, description="Figma API token"),
):
    figma_token = _get_figma_token(token, request)
    headers = {"User-Agent": "ProjectWorkspace/1.0"}
    if figma_token:
        headers["X-Figma-Token"] = figma_token

    url = f"{FIGMA_API}/v1/files/{file_key}"

    logger.info(
        "Figma proxy request: method=GET url=%s has_auth=%s",
        url, "yes" if figma_token else "no",
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers)

    logger.info(
        "Figma proxy response: url=%s status=%d",
        url, resp.status_code,
    )

    try:
        body = resp.json()
    except Exception:
        body = {"message": resp.text}

    return JSONResponse(
        status_code=resp.status_code,
        content=body,
    )


@router.get("/thumbnail")
async def proxy_figma_thumbnail(
    request: Request,
    url: str = Query(..., description="Figma thumbnail image URL"),
    token: str = Query(None, description="Figma API token"),
):
    figma_token = _get_figma_token(token, request)
    headers = {"User-Agent": "ProjectWorkspace/1.0"}
    if figma_token:
        headers["X-Figma-Token"] = figma_token

    logger.info("Figma thumbnail proxy: url=%s has_auth=%s", url, "yes" if figma_token else "no")

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)

    content_type = resp.headers.get("content-type", "image/png")
    cache_control = "private, max-age=3600"

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=content_type,
        headers={"Cache-Control": cache_control, "Access-Control-Allow-Origin": "*"},
    )
