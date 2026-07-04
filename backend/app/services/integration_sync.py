import httpx
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.integrations.models import Integration
from app.core.activity import log_activity


class IntegrationSyncError(Exception):
    pass


def sync_integration(integration: Integration, db: Session, causer_id: int) -> dict:
    syncers = {
        "github": _sync_github,
        "figma": _sync_figma,
        "email_hook": _sync_email_hook,
    }
    syncer = syncers.get(integration.type)
    if not syncer:
        raise IntegrationSyncError(f"Unknown integration type: {integration.type}")

    try:
        result = syncer(integration)
        integration.last_synced_at = datetime.now(timezone.utc)
        db.commit()
        log_activity(
            db, "integrations", integration.id,
            f"Integration synced: {integration.type}",
            causer_id=causer_id,
            properties={"type": integration.type, "result": result.get("status", "ok")},
            event="sync",
        )
        return result
    except IntegrationSyncError:
        raise
    except Exception as e:
        raise IntegrationSyncError(f"Sync failed: {str(e)}")


def _sync_github(integration: Integration) -> dict:
    config = integration.config or {}
    token = config.get("token") or config.get("access_token")
    repo = config.get("repo") or config.get("repository")

    if not token or not repo:
        return {"status": "skipped", "message": "GitHub token or repo not configured"}

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "InternalTaskManager/1.0",
    }

    results = {}
    try:
        repo_url = f"https://api.github.com/repos/{repo}"
        resp = httpx.get(repo_url, headers=headers, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            results["repository"] = {
                "name": data.get("full_name"),
                "description": data.get("description"),
                "stars": data.get("stargazers_count", 0),
                "open_issues": data.get("open_issues_count", 0),
                "default_branch": data.get("default_branch"),
            }
            results["issues"] = []
            issues_resp = httpx.get(f"{repo_url}/issues?state=open&per_page=10", headers=headers, timeout=30)
            if issues_resp.status_code == 200:
                results["issues"] = [
                    {"number": i["number"], "title": i["title"], "state": i["state"], "url": i["html_url"]}
                    for i in issues_resp.json()
                ]
        else:
            return {"status": "error", "message": f"GitHub API returned {resp.status_code}"}
    except httpx.RequestError as e:
        return {"status": "error", "message": f"GitHub connection failed: {str(e)}"}

    return {"status": "ok", "data": results}


def _sync_figma(integration: Integration) -> dict:
    config = integration.config or {}
    token = config.get("token") or config.get("access_token")
    file_key = config.get("file_key") or config.get("file")

    if not token or not file_key:
        return {"status": "skipped", "message": "Figma token or file key not configured"}

    headers = {"X-Figma-Token": token}

    try:
        file_url = f"https://api.figma.com/v1/files/{file_key}"
        resp = httpx.get(file_url, headers=headers, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "status": "ok",
                "data": {
                    "name": data.get("name"),
                    "version": data.get("version"),
                    "last_modified": data.get("lastModified"),
                },
            }
        else:
            return {"status": "error", "message": f"Figma API returned {resp.status_code}"}
    except httpx.RequestError as e:
        return {"status": "error", "message": f"Figma connection failed: {str(e)}"}


def _sync_email_hook(integration: Integration) -> dict:
    config = integration.config or {}
    webhook_url = config.get("webhook_url")
    if not webhook_url:
        return {"status": "skipped", "message": "Webhook URL not configured"}
    try:
        resp = httpx.post(
            webhook_url,
            json={"event": "ping", "timestamp": datetime.now(timezone.utc).isoformat()},
            timeout=15,
        )
        return {"status": "ok" if resp.status_code < 500 else "error", "message": f"Webhook responded with {resp.status_code}"}
    except httpx.RequestError as e:
        return {"status": "error", "message": f"Webhook connection failed: {str(e)}"}
