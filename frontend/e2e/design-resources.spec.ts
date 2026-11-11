import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";

test.describe("Design & Resource System", () => {
  let accessToken: string;
  let projectId: number;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: "admin@company.com", password: "password" },
    });
    const loginBody = await loginRes.json();
    accessToken = loginBody.access_token;

    const projectsRes = await request.get(`${API}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projectsBody = await projectsRes.json();
    projectId = projectsBody.items?.[0]?.id;
  });

  const authHeaders = () => ({ Authorization: `Bearer ${accessToken}` });

  // ========== FIGMA PROXY ==========
  test.describe("Figma Connection", () => {
    test("Figma proxy returns error for public repo without token", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/figma/files/invalid_key`, {
        headers: authHeaders(),
      });
      expect([403, 404]).toContain(res.status());
    });

    test("Figma proxy accepts token query parameter", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/figma/files/test_key?token=test_token`, {
        headers: authHeaders(),
      });
      expect([403, 401, 200]).toContain(res.status());
      const body = await res.json();
      expect(body).toBeTruthy();
    });

    test("Figma proxy accepts Authorization header", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/figma/files/test_key`, {
        headers: { ...authHeaders(), Authorization: "Bearer test_token" },
      });
      expect([403, 401, 200]).toContain(res.status());
    });

    test("Project stores figma_url and figma_token", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/projects/${projectId}`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("figma_url");
      expect(body).toHaveProperty("figma_token");
    });

    test("Project update accepts figma_token", async ({ request }) => {
      const updateRes = await request.put(`${API}/api/v1/projects/${projectId}`, {
        headers: authHeaders(),
        data: {
          figma_url: "https://www.figma.com/file/abc123/Test",
          figma_token: "figd_test_token",
        },
      });
      expect(updateRes.status()).toBe(200);
      const body = await updateRes.json();
      expect(body.figma_url).toContain("figma.com");
      expect(body.figma_token).toBe("figd_test_token");

      await request.put(`${API}/api/v1/projects/${projectId}`, {
        headers: authHeaders(),
        data: { figma_url: null, figma_token: null },
      });
    });
  });

  // ========== DESIGN ASSET UPLOAD ==========
  test.describe("Design Asset Upload", () => {
    test("Upload PNG design asset", async ({ request }) => {
      const formData = new FormData();
      const content = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const blob = new Blob([content], { type: "image/png" });
      formData.append("file", new File([blob], "test-design.png", { type: "image/png" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.mime_type).toContain("image");
      expect(body.name).toBe("test-design.png");
      return body.id;
    });

    test("Upload SVG design asset", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(
        ['<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'],
        { type: "image/svg+xml" },
      );
      formData.append("file", new File([blob], "design-icon.svg", { type: "image/svg+xml" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("design-icon.svg");
    });

    test("Upload PDF design asset", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
      formData.append("file", new File([blob], "design-spec.pdf", { type: "application/pdf" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.mime_type).toContain("pdf");
    });

    test("Upload AI (Adobe Illustrator) file", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["%AI file data"], { type: "application/postscript" });
      formData.append(
        "file",
        new File([blob], "illustration.ai", { type: "application/postscript" }),
      );
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("illustration.ai");
    });

    test("Upload PSD (Photoshop) file", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["PSD file data"], { type: "image/vnd.adobe.photoshop" });
      formData.append(
        "file",
        new File([blob], "mockup.psd", { type: "image/vnd.adobe.photoshop" }),
      );
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
    });

    test("Upload ZIP design package", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["PK ZIP data"], { type: "application/zip" });
      formData.append("file", new File([blob], "design-package.zip", { type: "application/zip" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("design-package.zip");
    });

    test("Upload WEBP image", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["RIFF WEBP data"], { type: "image/webp" });
      formData.append("file", new File([blob], "photo.webp", { type: "image/webp" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
    });

    test("Upload GIF image", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["GIF89a"], { type: "image/gif" });
      formData.append("file", new File([blob], "animation.gif", { type: "image/gif" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
    });
  });

  // ========== FILE VALIDATION ==========
  test.describe("File Validation", () => {
    test("Reject disallowed extension .exe", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["malware"], { type: "application/x-executable" });
      formData.append("file", new File([blob], "virus.exe", { type: "application/x-executable" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.detail).toContain("not allowed");
    });

    test("Reject disallowed extension .php", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["<?php echo 'hacked'; ?>"], { type: "application/x-php" });
      formData.append("file", new File([blob], "shell.php", { type: "application/x-php" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(400);
    });

    test("Reject disallowed extension .sh", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["#!/bin/bash"], { type: "application/x-sh" });
      formData.append("file", new File([blob], "script.sh", { type: "application/x-sh" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(400);
    });

    test("Allow all design-relevant extensions", async ({ request }) => {
      const allowedDesign = [
        { ext: "png", mime: "image/png" },
        { ext: "jpg", mime: "image/jpeg" },
        { ext: "jpeg", mime: "image/jpeg" },
        { ext: "gif", mime: "image/gif" },
        { ext: "webp", mime: "image/webp" },
        { ext: "svg", mime: "image/svg+xml" },
        { ext: "pdf", mime: "application/pdf" },
        { ext: "ai", mime: "application/postscript" },
        { ext: "psd", mime: "image/vnd.adobe.photoshop" },
        { ext: "eps", mime: "application/postscript" },
        { ext: "zip", mime: "application/zip" },
      ];

      for (const { ext, mime } of allowedDesign) {
        const formData = new FormData();
        const blob = new Blob(["test"], { type: mime });
        formData.append("file", new File([blob], `test.${ext}`, { type: mime }));
        formData.append("model_type", "project");
        formData.append("model_id", String(projectId));
        formData.append("collection_name", "design");

        const res = await request.post(`${API}/api/v1/attachments/upload`, {
          headers: authHeaders(),
          multipart: formData as any,
        });
        expect(
          res.status(),
          `Expected 201 for .${ext}, got ${res.status()}: ${await res.text()}`,
        ).toBe(201);
      }
    });

    test("Path traversal in filename is sanitized", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      formData.append("file", new File([blob], "../../../etc/passwd.txt", { type: "text/plain" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      if (res.status() === 201) {
        const body = await res.json();
        expect(body.url).not.toContain("../");
        expect(body.name).not.toContain("../");
      }
    });
  });

  // ========== ATTACHMENT OPERATIONS ==========
  test.describe("Attachment Operations", () => {
    let attachmentId: number;

    test("List attachments for project", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/attachments`, {
        headers: authHeaders(),
        params: { model_type: "project", model_id: projectId, collection_name: "design" },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      if (body.items.length > 0) {
        attachmentId = body.items[0].id;
      }
    });

    test("Download attachment by ID", async ({ request }) => {
      if (!attachmentId) return;
      const res = await request.get(`${API}/api/v1/attachments/download/${attachmentId}`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
    });

    test("Download attachment inline", async ({ request }) => {
      if (!attachmentId) return;
      const res = await request.get(
        `${API}/api/v1/attachments/download/${attachmentId}?inline=true`,
        {
          headers: authHeaders(),
        },
      );
      expect(res.status()).toBe(200);
    });

    test("Delete attachment", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["delete me"], { type: "text/plain" });
      formData.append("file", new File([blob], "to-delete.txt", { type: "text/plain" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const uploadRes = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(uploadRes.status()).toBe(201);
      const uploaded = await uploadRes.json();

      const delRes = await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, {
        headers: authHeaders(),
      });
      expect(delRes.status()).toBe(200);

      const getRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}`, {
        headers: authHeaders(),
      });
      expect(getRes.status()).toBe(404);
    });
  });

  // ========== RESOURCE OPERATIONS ==========
  test.describe("Resource Operations", () => {
    let resourceId: number;

    test("Create resource with link", async ({ request }) => {
      const res = await request.post(`${API}/api/v1/resources?project_id=${projectId}`, {
        headers: authHeaders(),
        data: {
          name: "API Documentation",
          description: "REST API docs",
          resource_type: "url",
          category: "Documentation",
          url: "https://docs.example.com/api",
          tags: ["api", "docs"],
        },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("API Documentation");
      expect(body.resource_type).toBe("url");
      resourceId = body.id;
    });

    test("Upload resource file", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["resource file content"], { type: "text/plain" });
      formData.append("file", new File([blob], "resource-doc.txt", { type: "text/plain" }));
      formData.append("name", "Resource Document");
      formData.append("resource_type", "document");
      formData.append("category", "Docs");

      const res = await request.post(`${API}/api/v1/resources/upload?project_id=${projectId}`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("Resource Document");
      expect(body.file_path).toBeTruthy();
      expect(body.file_size).toBeGreaterThan(0);
      expect(body.current_version).toBe(1);
    });

    test("List resources", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: authHeaders(),
        params: { project_id: projectId },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
    });

    test("Get resource detail", async ({ request }) => {
      if (!resourceId) return;
      const res = await request.get(`${API}/api/v1/resources/${resourceId}`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("API Documentation");
    });

    test("Update resource", async ({ request }) => {
      if (!resourceId) return;
      const res = await request.put(`${API}/api/v1/resources/${resourceId}`, {
        headers: authHeaders(),
        data: { name: "Updated API Docs", description: "Updated description" },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Updated API Docs");
    });

    test("Get resource versions", async ({ request }) => {
      if (!resourceId) return;
      const res = await request.get(`${API}/api/v1/resources/${resourceId}/versions`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.current_version).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(body.versions)).toBe(true);
    });

    test("Get resource activity", async ({ request }) => {
      if (!resourceId) return;
      const res = await request.get(`${API}/api/v1/resources/${resourceId}/activity`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.activities)).toBe(true);
    });

    test("Resource search and filter", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: authHeaders(),
        params: { project_id: projectId, search: "API", resource_type: "url" },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.items).toBeDefined();
    });

    test("Resource sorting", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: authHeaders(),
        params: { project_id: projectId, sort_by: "alphabetical" },
      });
      expect(res.status()).toBe(200);
    });

    test("Soft delete resource", async ({ request }) => {
      if (!resourceId) return;
      const res = await request.delete(`${API}/api/v1/resources/${resourceId}`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);

      const getRes = await request.get(`${API}/api/v1/resources/${resourceId}`, {
        headers: authHeaders(),
      });
      expect(getRes.status()).toBe(404);
    });
  });

  // ========== RESOURCE FILE OPERATIONS ==========
  test.describe("Resource File Operations", () => {
    let fileResourceId: number;

    test.beforeAll(async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["file content for preview"], { type: "text/plain" });
      formData.append("file", new File([blob], "preview-test.txt", { type: "text/plain" }));
      formData.append("name", "Preview Test File");
      formData.append("resource_type", "document");

      const res = await request.post(`${API}/api/v1/resources/upload?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: formData as any,
      });
      const body = await res.json();
      fileResourceId = body.id;
    });

    test("Download resource file", async ({ request }) => {
      if (!fileResourceId) return;
      const res = await request.get(`${API}/api/v1/resources/${fileResourceId}/file`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
    });

    test("Download resource file inline", async ({ request }) => {
      if (!fileResourceId) return;
      const res = await request.get(`${API}/api/v1/resources/${fileResourceId}/file?inline=true`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
    });

    test("Track download", async ({ request }) => {
      if (!fileResourceId) return;
      const res = await request.post(`${API}/api/v1/resources/${fileResourceId}/download`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
    });

    test("Upload new version", async ({ request }) => {
      if (!fileResourceId) return;
      const formData = new FormData();
      const blob = new Blob(["version 2 content"], { type: "text/plain" });
      formData.append("file", new File([blob], "preview-test-v2.txt", { type: "text/plain" }));

      const res = await request.post(`${API}/api/v1/resources/${fileResourceId}/versions`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.current_version).toBe(2);
    });

    test("Clean up file resource", async ({ request }) => {
      if (!fileResourceId) return;
      await request.delete(`${API}/api/v1/resources/${fileResourceId}`, {
        headers: authHeaders(),
      });
    });
  });

  // ========== RESOURCE LINKS ==========
  test.describe("Resource Links", () => {
    let linkResourceId: number;
    let linkId: number;

    test.beforeAll(async ({ request }) => {
      const res = await request.post(`${API}/api/v1/resources?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { name: "Link Test Resource", resource_type: "url", url: "https://example.com" },
      });
      const body = await res.json();
      linkResourceId = body.id;
    });

    test("Create resource link", async ({ request }) => {
      const res = await request.post(`${API}/api/v1/resources/${linkResourceId}/links`, {
        headers: authHeaders(),
        data: { linked_type: "task", linked_id: 1 },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      linkId = body.id;
    });

    test("Get resource links", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${linkResourceId}/links`, {
        headers: authHeaders(),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.links.length).toBeGreaterThan(0);
    });

    test("Duplicate link returns 409", async ({ request }) => {
      const res = await request.post(`${API}/api/v1/resources/${linkResourceId}/links`, {
        headers: authHeaders(),
        data: { linked_type: "task", linked_id: 1 },
      });
      expect(res.status()).toBe(409);
    });

    test("Delete resource link", async ({ request }) => {
      const res = await request.delete(
        `${API}/api/v1/resources/${linkResourceId}/links/${linkId}`,
        {
          headers: authHeaders(),
        },
      );
      expect(res.status()).toBe(200);
    });

    test("Clean up link resource", async ({ request }) => {
      await request.delete(`${API}/api/v1/resources/${linkResourceId}`, {
        headers: authHeaders(),
      });
    });
  });

  // ========== THUMBNAILS & PREVIEWS ==========
  test.describe("Thumbnails and Previews", () => {
    test("Image attachment serves inline", async ({ request }) => {
      const formData = new FormData();
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const blob = new Blob([pngHeader], { type: "image/png" });
      formData.append("file", new File([blob], "thumb-test.png", { type: "image/png" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const uploadRes = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      const uploaded = await uploadRes.json();

      const inlineRes = await request.get(
        `${API}/api/v1/attachments/download/${uploaded.id}?inline=true`,
        {
          headers: authHeaders(),
        },
      );
      expect(inlineRes.status()).toBe(200);

      await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: authHeaders() });
    });

    test("PDF attachment serves inline", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(["%PDF-1.4 test content"], { type: "application/pdf" });
      formData.append("file", new File([blob], "preview-test.pdf", { type: "application/pdf" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const uploadRes = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      const uploaded = await uploadRes.json();

      const inlineRes = await request.get(
        `${API}/api/v1/attachments/download/${uploaded.id}?inline=true`,
        {
          headers: authHeaders(),
        },
      );
      expect(inlineRes.status()).toBe(200);

      await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: authHeaders() });
    });

    test("SVG attachment serves inline", async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(
        ['<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>'],
        { type: "image/svg+xml" },
      );
      formData.append("file", new File([blob], "icon.svg", { type: "image/svg+xml" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");

      const uploadRes = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: authHeaders(),
        multipart: formData as any,
      });
      const uploaded = await uploadRes.json();

      const inlineRes = await request.get(
        `${API}/api/v1/attachments/download/${uploaded.id}?inline=true`,
        {
          headers: authHeaders(),
        },
      );
      expect(inlineRes.status()).toBe(200);

      await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: authHeaders() });
    });
  });

  // ========== MULTIPLE UPLOADS ==========
  test.describe("Multiple Uploads", () => {
    test("Upload multiple files sequentially", async ({ request }) => {
      const files = [
        { name: "multi-1.png", mime: "image/png" },
        { name: "multi-2.pdf", mime: "application/pdf" },
        { name: "multi-3.svg", mime: "image/svg+xml" },
      ];

      const ids: number[] = [];
      for (const { name, mime } of files) {
        const formData = new FormData();
        const blob = new Blob(["test data"], { type: mime });
        formData.append("file", new File([blob], name, { type: mime }));
        formData.append("model_type", "project");
        formData.append("model_id", String(projectId));
        formData.append("collection_name", "design");

        const res = await request.post(`${API}/api/v1/attachments/upload`, {
          headers: authHeaders(),
          multipart: formData as any,
        });
        expect(res.status()).toBe(201);
        const body = await res.json();
        ids.push(body.id);
      }

      const listRes = await request.get(`${API}/api/v1/attachments`, {
        headers: authHeaders(),
        params: { model_type: "project", model_id: projectId, collection_name: "design" },
      });
      const listBody = await listRes.json();
      expect(listBody.items.length).toBeGreaterThanOrEqual(files.length);

      for (const id of ids) {
        await request.delete(`${API}/api/v1/attachments/${id}`, { headers: authHeaders() });
      }
    });
  });
});
