import logging
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

GITHUB_API = "https://api.github.com"

# Per GitHub API docs: https://docs.github.com/en/rest/overview/api-versions
GITHUB_API_VERSION = "2022-11-28"


async def _proxy(path: str, request: Request):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ProjectWorkspace/1.0",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }
    auth = request.headers.get("Authorization")
    if auth:
        token = auth.replace("Bearer ", "", 1)
        if token.strip():
            headers["Authorization"] = auth

    params = dict(request.query_params)
    url = f"{GITHUB_API}{path}"

    logger.info(
        "GitHub proxy request: method=GET url=%s has_auth=%s",
        url, "yes" if auth else "no",
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers, params=params)

    logger.info(
        "GitHub proxy response: url=%s status=%d headers=%s body=%s",
        url, resp.status_code,
        {k: v for k, v in resp.headers.items() if k.lower() in (
            "content-type", "x-ratelimit-remaining", "x-ratelimit-limit",
            "x-ratelimit-reset", "x-github-request-id", "x-github-api-version-selected",
            "status",
        )},
        resp.text,
    )

    try:
        body = resp.json()
    except Exception:
        body = {"message": resp.text}

    return JSONResponse(
        status_code=resp.status_code,
        content=body,
    )


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
