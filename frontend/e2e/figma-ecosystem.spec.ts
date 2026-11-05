import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8000";

function makePng(size = 200): Buffer {
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(size, 0);
  IHDR.writeUInt32BE(size, 4);
  IHDR.writeUInt8(8, 8);
  IHDR.writeUInt8(2, 9);
  IHDR.writeUInt8(0, 10);
  IHDR.writeUInt8(0, 11);
  IHDR.writeUInt8(0, 12);
  const ihdrChunk = makeChunk("IHDR", IHDR);
  const idatData = Buffer.alloc(size * 3 + 1, 0x00);
  const idatChunk = makeChunk("IDAT", idatData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return c ^ 0xffffffff;
}

function makeMinimalSvg(): Buffer {
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>',
    "utf-8"
  );
}

function makeGif(): Buffer {
  return Buffer.from(
    "GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
    "binary"
  );
}

function makeMinimalPdf(): Buffer {
  return Buffer.from(
    "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF",
    "ascii"
  );
}

async function login(api: APIRequestContext): Promise<string> {
  const res = await api.post("/api/v1/auth/login", {
    data: { email: "admin@company.com", password: "password" },
  });
  const body = await res.json();
  return body.access_token || body.data?.access_token;
}

async function getProjectId(api: APIRequestContext, token: string): Promise<number> {
  const projRes = await api.get("/api/v1/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const projBody = await projRes.json();
  const projects = projBody.items || projBody.data || projBody || [];
  if (projects.length > 0) return projects[0].id;
  const createRes = await api.post("/api/v1/projects", {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: "Figma Thumbnail Test Project" },
  });
  const created = await createRes.json();
  return created.id || created.data?.id;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function uploadAttachment(
  request: APIRequestContext,
  token: string,
  projectId: number,
  fileName: string,
  content: Buffer,
  mime: string,
  collection = "attachments"
): Promise<{ id: number; name: string; url: string } | null> {
  const fd = new FormData();
  const blob = new Blob([content], { type: mime });
  fd.append("file", new File([blob], fileName, { type: mime }));
  fd.append("model_type", "project");
  fd.append("model_id", String(projectId));
  fd.append("collection_name", collection);
  const res = await request.post(`${API}/api/v1/attachments/upload`, {
    headers: auth(token),
    multipart: fd as any,
  });
  if (res.status() !== 201) return null;
  return res.json();
}

test.describe("Figma Ecosystem & Thumbnails", () => {
  let token: string;
  let projectId: number;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
    projectId = await getProjectId(request, token);
  });

  // -- Figma Thumbnail Proxy --

  test("2.1 -- Thumbnail proxy returns non-500 with auth", async ({ request }) => {
    const thumbUrl = "https://s3-alpha.figma.com/thumbnails/example.png";
    const res = await request.get(
      `${API}/api/v1/figma/thumbnail?url=${encodeURIComponent(thumbUrl)}`,
      { headers: auth(token) }
    );
    expect(res.status()).toBeLessThan(500);
  });

  test("2.2 -- Thumbnail proxy requires auth", async ({ request }) => {
    const thumbUrl = "https://s3-alpha.figma.com/thumbnails/example.png";
    const res = await request.get(
      `${API}/api/v1/figma/thumbnail?url=${encodeURIComponent(thumbUrl)}`
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("2.3 -- Figma files proxy requires auth", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/figma/files/ABC123`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  // -- Image Thumbnail Auth --

  test("3.1 -- Uploaded image inline serving has correct headers", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test-thumb.png", makePng(100), "image/png");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const inlineRes = await request.get(
      `${API}/api/v1/attachments/download/${uploaded.id}?inline=true`,
      { headers: auth(token) }
    );
    expect(inlineRes.status()).toBe(200);
    expect(inlineRes.headers()["content-type"]).toContain("image");
    expect(inlineRes.headers()["content-disposition"]).toContain("inline");

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("3.2 -- Image download without auth returns 403", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "noauth.png", makePng(50), "image/png");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const noAuthRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}?inline=true`);
    expect(noAuthRes.status()).toBeGreaterThanOrEqual(400);

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  // -- SVG, GIF, PDF --

  test("5.1 -- SVG upload and inline serving works", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.svg", makeMinimalSvg(), "image/svg+xml");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const dlRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}?inline=true`, { headers: auth(token) });
    expect(dlRes.status()).toBe(200);
    expect(dlRes.headers()["content-type"]).toContain("svg");

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("6.1 -- GIF upload and inline serving works", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.gif", makeGif(), "image/gif");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const dlRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}?inline=true`, { headers: auth(token) });
    expect(dlRes.status()).toBe(200);
    expect(dlRes.headers()["content-type"]).toContain("gif");

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("7.1 -- PDF upload and inline serving works", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.pdf", makeMinimalPdf(), "application/pdf");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const dlRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}?inline=true`, { headers: auth(token) });
    expect(dlRes.status()).toBe(200);
    expect(dlRes.headers()["content-type"]).toContain("pdf");

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  // -- Cache-Control & ETag --

  test("8.1 -- Inline has Cache-Control private max-age=3600 and ETag", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "cache-test.png", makePng(50), "image/png");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const dlRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}?inline=true`, { headers: auth(token) });
    expect(dlRes.headers()["cache-control"]).toBe("private, max-age=3600");
    expect(dlRes.headers()["etag"]).toBeTruthy();

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("8.2 -- Non-inline has Cache-Control max-age=0 must-revalidate", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "cache-test2.png", makePng(50), "image/png");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;

    const dlRes = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}`, { headers: auth(token) });
    expect(dlRes.headers()["cache-control"]).toBe("private, max-age=0, must-revalidate");

    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  // -- Thumbnail Failure Handling --

  test("10.1 -- Non-existent attachment returns 404", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/attachments/download/999999?inline=true`, { headers: auth(token) });
    expect(res.status()).toBe(404);
  });

  test("10.2 -- Thumbnail proxy with invalid URL returns error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/figma/thumbnail?url=${encodeURIComponent("not-a-url")}`,
      { headers: auth(token) }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  // -- Design File Upload Validation --

  test("11.1 -- AI file upload is accepted", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.ai", Buffer.from("%!PS-Adobe-3.0", "ascii"), "application/postscript");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;
    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("11.2 -- PSD file upload is accepted", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.psd", Buffer.from("8BPS", "ascii"), "image/vnd.adobe.photoshop");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;
    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  test("11.3 -- EPS file upload is accepted", async ({ request }) => {
    const uploaded = await uploadAttachment(request, token, projectId, "test.eps", Buffer.from("%!PS-Adobe-3.0 EPSF-3.0", "ascii"), "application/postscript");
    expect(uploaded).toBeTruthy();
    if (!uploaded) return;
    await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, { headers: auth(token) });
  });

  // -- Figma URL Storage --

  test("1.1 -- Figma /file/ URL stored on project", async ({ request }) => {
    const t = await login(request);
    const pid = await getProjectId(request, t);
    const res = await request.put(`${API}/api/v1/projects/${pid}`, {
      headers: auth(t),
      data: { figma_url: "https://www.figma.com/file/ABC123/My-Design?node-id=1-2" },
    });
    expect(res.status()).toBe(200);
    await request.put(`${API}/api/v1/projects/${pid}`, { headers: auth(t), data: { figma_url: "" } });
  });

  test("1.2 -- Figma /design/ URL stored on project", async ({ request }) => {
    const t = await login(request);
    const pid = await getProjectId(request, t);
    const res = await request.put(`${API}/api/v1/projects/${pid}`, {
      headers: auth(t),
      data: { figma_url: "https://www.figma.com/design/ABC123/My-Design" },
    });
    expect(res.status()).toBe(200);
    await request.put(`${API}/api/v1/projects/${pid}`, { headers: auth(t), data: { figma_url: "" } });
  });

  test("1.3 -- Figma /proto/ URL stored on project", async ({ request }) => {
    const t = await login(request);
    const pid = await getProjectId(request, t);
    const res = await request.put(`${API}/api/v1/projects/${pid}`, {
      headers: auth(t),
      data: { figma_url: "https://www.figma.com/proto/ABC123/My-Prototype" },
    });
    expect(res.status()).toBe(200);
    await request.put(`${API}/api/v1/projects/${pid}`, { headers: auth(t), data: { figma_url: "" } });
  });

  test("1.4 -- Figma /board/ URL stored on project", async ({ request }) => {
    const t = await login(request);
    const pid = await getProjectId(request, t);
    const res = await request.put(`${API}/api/v1/projects/${pid}`, {
      headers: auth(t),
      data: { figma_url: "https://www.figma.com/board/ABC123/My-FigJam" },
    });
    expect(res.status()).toBe(200);
    await request.put(`${API}/api/v1/projects/${pid}`, { headers: auth(t), data: { figma_url: "" } });
  });

  test("1.5 -- Figma /make/ URL stored on project", async ({ request }) => {
    const t = await login(request);
    const pid = await getProjectId(request, t);
    const res = await request.put(`${API}/api/v1/projects/${pid}`, {
      headers: auth(t),
      data: { figma_url: "https://www.figma.com/make/ABC123/My-Design" },
    });
    expect(res.status()).toBe(200);
    await request.put(`${API}/api/v1/projects/${pid}`, { headers: auth(t), data: { figma_url: "" } });
  });
});
