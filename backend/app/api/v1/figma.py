import logging
import httpx
from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

FIGMA_API = "https://api.figma.com"


@router.get("/files/{file_key}")
async def get_figma_file(
    file_key: str,
    request: Request,
    token: str = Query(None, description="Figma API token"),
):
    headers = {"User-Agent": "ProjectWorkspace/1.0"}
    
    figma_token = token
    if not figma_token:
        auth = request.headers.get("Authorization")
        if auth:
            figma_token = auth.replace("Bearer ", "", 1).strip()
    
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
