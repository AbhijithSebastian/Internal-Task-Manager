import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

FIGMA_API = "https://api.figma.com"


@router.get("/files/{file_key}")
async def get_figma_file(file_key: str, request: Request):
    headers = {"User-Agent": "ProjectWorkspace/1.0"}
    auth = request.headers.get("Authorization")
    if auth:
        headers["X-Figma-Token"] = auth.replace("Bearer ", "")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{FIGMA_API}/v1/files/{file_key}", headers=headers)

    if resp.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={"error": "File not found", "code": "NOT_FOUND", "status": 404},
        )
    if resp.status_code in (401, 403):
        return JSONResponse(
            status_code=resp.status_code,
            content={
                "error": "Access denied" if resp.status_code == 403 else "Authentication failed",
                "code": "FORBIDDEN" if resp.status_code == 403 else "UNAUTHORIZED",
                "status": resp.status_code,
                "message": "This file is private or requires authentication.",
            },
        )
    if resp.status_code == 429:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limited", "code": "RATE_LIMITED", "status": 429, "message": "Figma API rate limit exceeded."},
        )
    if resp.status_code >= 500:
        return JSONResponse(
            status_code=502,
            content={"error": "Provider unavailable", "code": "PROVIDER_ERROR", "status": 502, "message": "Figma API returned a server error."},
        )

    data = resp.json()
    return JSONResponse(content={
        "name": data.get("name"),
        "version": data.get("version"),
        "lastModified": data.get("lastModified"),
        "thumbnailUrl": data.get("thumbnailUrl"),
        "owner": data.get("owner"),
        "pages": data.get("document", {}).get("children", []),
    })
