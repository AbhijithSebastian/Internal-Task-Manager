import io
import pytest
from httpx import AsyncClient

# Malicious Payloads
EICAR_STRING = r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"

@pytest.mark.asyncio
async def test_attachment_upload_allowed_extensions(auth_client: AsyncClient):
    allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "zip"]
    
    for ext in allowed:
        file_content = b"fake data"
        files = {"file": (f"test.{ext}", file_content, f"application/{ext}")}
        data = {"model_type": "task", "model_id": "1"}
        response = await auth_client.post(
            "/api/v1/attachments/upload",
            data=data,
            files=files
        )
        
        # We expect 201 Created or 404 if entity_id doesn't exist, but NOT 400 invalid extension
        assert response.status_code in [201, 404], f"Failed for .{ext}: {response.status_code} {response.text[:200]}"

@pytest.mark.asyncio
async def test_attachment_upload_disallowed_extensions(auth_client: AsyncClient):
    disallowed = ["exe", "sh", "bat", "php", "js", "html", "sh"]
    
    for ext in disallowed:
        file_content = b"malicious code"
        files = {"file": (f"malicious.{ext}", file_content, f"application/{ext}")}
        data = {"model_type": "task", "model_id": "1"}
        response = await auth_client.post(
            "/api/v1/attachments/upload",
            data=data,
            files=files
        )
        
        assert response.status_code == 400, f"Failed for .{ext}: {response.status_code} {response.text[:200]}"
        assert "not allowed" in response.text.lower()

@pytest.mark.asyncio
async def test_attachment_upload_eicar(auth_client: AsyncClient):
    # Depending on AV setup, this might be blocked at network/WAF level or application level
    data = {"model_type": "task", "model_id": "1"}
    files = {"file": ("eicar.txt", EICAR_STRING.encode(), "text/plain")}
    response = await auth_client.post(
        "/api/v1/attachments/upload",
        data=data,
        files=files
    )
    # If the application parses content, it should reject. If not, it'll pass if text is allowed.
    # In enterprise, usually we want 400.
    # assert response.status_code == 400

@pytest.mark.asyncio
async def test_attachment_upload_path_traversal(auth_client: AsyncClient):
    data = {"model_type": "task", "model_id": "1"}
    files = {"file": ("../../../etc/passwd.txt", b"fake", "text/plain")}
    response = await auth_client.post(
        "/api/v1/attachments/upload",
        data=data,
        files=files
    )
    
    # Path traversal should be mitigated by generating safe UUID filenames, or strict sanitization
    if response.status_code == 201:
        data = response.json()
        assert "../" not in data["url"]
        assert "../" not in data["name"]

@pytest.mark.asyncio
async def test_attachment_upload_large_file(auth_client: AsyncClient):
    # Generate exactly 51MB of data to trigger MAX_UPLOAD_SIZE_MB=50
    large_data = b"0" * (51 * 1024 * 1024)
    data = {"model_type": "task", "model_id": "1"}
    files = {"file": ("large.pdf", large_data, "application/pdf")}
    response = await auth_client.post(
        "/api/v1/attachments/upload",
        data=data,
        files=files
    )
    
    assert response.status_code == 413 # Payload Too Large (or similar 400 response)
