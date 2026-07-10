import httpx
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

router = APIRouter()

GITHUB_API = "https://api.github.com"


async def _proxy(path: str, request: Request):
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ProjectWorkspace/1.0",
    }
    auth = request.headers.get("Authorization")
    if auth:
        headers["Authorization"] = auth

    params = dict(request.query_params)
    url = f"{GITHUB_API}{path}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers, params=params)

    if resp.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={"error": "Repository not found", "code": "NOT_FOUND", "status": 404},
        )
    if resp.status_code in (401, 403):
        return JSONResponse(
            status_code=resp.status_code,
            content={
                "error": "Access denied" if resp.status_code == 403 else "Authentication failed",
                "code": "FORBIDDEN" if resp.status_code == 403 else "UNAUTHORIZED",
                "status": resp.status_code,
                "message": "Invalid or missing token. Check your GitHub Personal Access Token permissions.",
            },
        )
    if resp.status_code == 429:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limited", "code": "RATE_LIMITED", "status": 429, "message": "GitHub API rate limit exceeded. Wait and try again."},
        )
    if resp.status_code >= 500:
        return JSONResponse(
            status_code=502,
            content={"error": "Provider unavailable", "code": "PROVIDER_ERROR", "status": 502, "message": "GitHub API returned a server error."},
        )

    return JSONResponse(content=resp.json())


@router.get("/repos/{owner}/{repo}")
async def get_repo(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}", request)


@router.get("/repos/{owner}/{repo}/commits")
async def get_commits(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/commits", request)


@router.get("/repos/{owner}/{repo}/pulls")
async def get_pulls(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/pulls", request)


@router.get("/repos/{owner}/{repo}/issues")
async def get_issues(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/issues", request)


@router.get("/repos/{owner}/{repo}/branches")
async def get_branches(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/branches", request)


@router.get("/repos/{owner}/{repo}/releases")
async def get_releases(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/releases", request)


@router.get("/repos/{owner}/{repo}/contributors")
async def get_contributors(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/contributors", request)


@router.get("/repos/{owner}/{repo}/languages")
async def get_languages(owner: str, repo: str, request: Request):
    return await _proxy(f"/repos/{owner}/{repo}/languages", request)
