import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8000";

// ──────────────────────────────────────────────────────────
// Helpers: real binary file content
// ──────────────────────────────────────────────────────────
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

function makeMinimalPdf(): Buffer {
  return Buffer.from(
    "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF",
    "ascii",
  );
}

function makeMinimalSvg(): Buffer {
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>',
    "utf-8",
  );
}

function makeMinimalJson(): Buffer {
  return Buffer.from(
    JSON.stringify({ name: "test", version: 1, items: ["a", "b", "c"] }, null, 2),
    "utf-8",
  );
}

function makeMarkdown(): Buffer {
  return Buffer.from(
    "# Hello World\n\nThis is a **test** document.\n\n## Section 1\n\n- Item 1\n- Item 2\n\n### Sub Section\n\nParagraph text here.",
    "utf-8",
  );
}

function makeMinimalCsv(): Buffer {
  return Buffer.from("name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago", "utf-8");
}

function makeText(): Buffer {
  return Buffer.from(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nSecond paragraph with more text content for preview testing.",
    "utf-8",
  );
}

function makeMinimalZip(): Buffer {
  const localHeader = Buffer.from(
    "504b0304" +
      "1400" +
      "0000" +
      "0800" +
      "00000000" +
      "00000000" +
      "00000000" +
      "0b000000" +
      "746573742e7478740a00" +
      "03000000" +
      "00000000" +
      "00000000" +
      "6c5c0000" +
      "48656c6c6f205a6970210a",
    "hex",
  );
  const cdEntry = Buffer.from(
    "504b0102" +
      "1400" +
      "1400" +
      "0000" +
      "0800" +
      "00000000" +
      "00000000" +
      "0b000000" +
      "00000000" +
      "00000000" +
      "0b000000" +
      "746573742e7478740a00" +
      "03000000" +
      "00000000" +
      "00000000" +
      "00000000" +
      "6c5c0000" +
      "00000000" +
      "00000000" +
      "00000000" +
      "6c5c0000",
    "hex",
  );
  const cdOffset = localHeader.length;
  const cdSize = cdEntry.length;
  const eocd = Buffer.alloc(22);
  eocd.write("504b0506", "hex");
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([localHeader, cdEntry, eocd]);
}

function makeMp4Header(): Buffer {
  const ftyp = Buffer.from("0000001c667479706d703432000000006d7034326d70343169736f6d", "hex");
  return ftyp;
}

function makeMinimalMp3(): Buffer {
  const frame = Buffer.alloc(144);
  frame[0] = 0xff;
  frame[1] = 0xfb;
  frame[2] = 0x90;
  frame[3] = 0x00;
  return frame;
}

function makePptx(): Buffer {
  const sig = Buffer.from("504b030414000000080000002100", "hex");
  const endSig = Buffer.from("504b050600000000", "hex");
  return Buffer.concat([sig, Buffer.alloc(100, 0x50), endSig]);
}

function makeXlsx(): Buffer {
  const sig = Buffer.from("504b030414000000080000002100", "hex");
  const endSig = Buffer.from("504b050600000000", "hex");
  return Buffer.concat([sig, Buffer.alloc(100, 0x58), endSig]);
}

// ──────────────────────────────────────────────────────────
// Test file registry
// ──────────────────────────────────────────────────────────
interface TestFile {
  name: string;
  mime: string;
  content: Buffer;
  category: string;
  previewType: string;
}

const ALL_FILES: TestFile[] = [
  {
    name: "design-hero.png",
    mime: "image/png",
    content: makePng(100),
    category: "image",
    previewType: "image",
  },
  {
    name: "photo.jpg",
    mime: "image/jpeg",
    content: Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(100, 0x00)]),
    category: "image",
    previewType: "image",
  },
  {
    name: "banner.webp",
    mime: "image/webp",
    content: Buffer.from("524946460000000057454250", "hex"),
    category: "image",
    previewType: "image",
  },
  {
    name: "icon.svg",
    mime: "image/svg+xml",
    content: makeMinimalSvg(),
    category: "image",
    previewType: "image",
  },
  {
    name: "screenshot.tiff",
    mime: "image/tiff",
    content: Buffer.from([0x49, 0x49, 0x2a, 0x00, ...Buffer.alloc(100, 0x00)]),
    category: "image",
    previewType: "image",
  },
  {
    name: "bitmap.bmp",
    mime: "image/bmp",
    content: Buffer.from([0x42, 0x4d, ...Buffer.alloc(100, 0x00)]),
    category: "image",
    previewType: "image",
  },
  {
    name: "favicon.ico",
    mime: "image/x-icon",
    content: Buffer.from([0x00, 0x00, 0x01, 0x00, ...Buffer.alloc(100, 0x00)]),
    category: "image",
    previewType: "image",
  },
  {
    name: "animation.gif",
    mime: "image/gif",
    content: Buffer.from(
      "47494638396101000100800000ffffff00000021f90400000000002c00000000010001000002024401003b",
      "hex",
    ),
    category: "image",
    previewType: "image",
  },
  {
    name: "mockup.psd",
    mime: "image/vnd.adobe.photoshop",
    content: Buffer.from("3842505d" + "0".repeat(200), "hex"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "illustration.ai",
    mime: "application/postscript",
    content: Buffer.from("%!PS-Adobe-3.0\n%%Title: AI File\n", "ascii"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "design-spec.eps",
    mime: "application/postscript",
    content: Buffer.from("%!PS-Adobe-3.0 EPSF-3.0\n", "ascii"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "layout.fig",
    mime: "application/octet-stream",
    content: Buffer.from("FIGMA FILE" + "0".repeat(100), "utf-8"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "prototype.xd",
    mime: "application/octet-stream",
    content: Buffer.from("XD FILE" + "0".repeat(100), "utf-8"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "ui-kit.sketch",
    mime: "application/octet-stream",
    content: Buffer.from("SKETCH FILE" + "0".repeat(100), "utf-8"),
    category: "design",
    previewType: "fallback",
  },
  {
    name: "report.pdf",
    mime: "application/pdf",
    content: makeMinimalPdf(),
    category: "document",
    previewType: "pdf",
  },
  {
    name: "report-100p.pdf",
    mime: "application/pdf",
    content: Buffer.from(
      "%PDF-1.4\n" +
        "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
        "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
        "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n" +
        "xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF",
      "ascii",
    ),
    category: "document",
    previewType: "pdf",
  },
  {
    name: "design.json",
    mime: "application/json",
    content: makeMinimalJson(),
    category: "document",
    previewType: "json",
  },
  {
    name: "readme.md",
    mime: "text/markdown",
    content: makeMarkdown(),
    category: "document",
    previewType: "markdown",
  },
  {
    name: "data.csv",
    mime: "text/csv",
    content: makeMinimalCsv(),
    category: "document",
    previewType: "csv",
  },
  {
    name: "notes.txt",
    mime: "text/plain",
    content: makeText(),
    category: "document",
    previewType: "text",
  },
  {
    name: "presentation.pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    content: makePptx(),
    category: "office",
    previewType: "office",
  },
  {
    name: "spreadsheet.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: makeXlsx(),
    category: "office",
    previewType: "office",
  },
  {
    name: "video-clip.mp4",
    mime: "video/mp4",
    content: makeMp4Header(),
    category: "media",
    previewType: "video",
  },
  {
    name: "screen-recording.mov",
    mime: "video/quicktime",
    content: Buffer.from("0000001c6674797071742020", "hex"),
    category: "media",
    previewType: "video",
  },
  {
    name: "podcast.mp3",
    mime: "audio/mpeg",
    content: makeMinimalMp3(),
    category: "media",
    previewType: "audio",
  },
  {
    name: "voice-note.wav",
    mime: "audio/wav",
    content: Buffer.from("524946460000000057415645666d7420", "hex"),
    category: "media",
    previewType: "audio",
  },
  {
    name: "archive.zip",
    mime: "application/zip",
    content: makeMinimalZip(),
    category: "archive",
    previewType: "fallback",
  },
];

const LARGE_FILE: TestFile = {
  name: "large-design.png",
  mime: "image/png",
  content: Buffer.concat([makePng(500), Buffer.alloc(2 * 1024 * 1024, 0x41)]),
  category: "image",
  previewType: "image",
};

// ──────────────────────────────────────────────────────────
// Main test suite
// ──────────────────────────────────────────────────────────
test.describe("RC: Design & Resource — Full Validation", () => {
  let token: string;
  let project1: number;
  let project2: number;
  const uploadedAttachmentIds: number[] = [];
  const uploadedResourceIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: "admin@company.com", password: "password" },
    });
    const loginBody = await login.json();
    token = loginBody.access_token;
    expect(token).toBeTruthy();

    const projects = await request.get(`${API}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pBody = await projects.json();
    const items = pBody.items || [];
    project1 = items[0]?.id;
    expect(project1).toBeTruthy();

    if (items.length >= 2) {
      project2 = items[1]?.id;
    } else {
      const createRes = await request.post(`${API}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: "RC-Test-Project-2", description: "Isolation test project" },
      });
      const created = await createRes.json();
      project2 = created.id;
    }
    expect(project2).toBeTruthy();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function uploadAttachment(
    request: APIRequestContext,
    file: TestFile,
    pid: number = project1,
    collection = "design",
  ): Promise<{ id: number; name: string; mime_type: string; size: number; url: string }> {
    const fd = new FormData();
    const blob = new Blob([file.content], { type: file.mime });
    fd.append("file", new File([blob], file.name, { type: file.mime }));
    fd.append("model_type", "project");
    fd.append("model_id", String(pid));
    fd.append("collection_name", collection);
    const res = await request.post(`${API}/api/v1/attachments/upload`, {
      headers: auth(),
      multipart: fd as any,
    });
    expect(res.status(), `Upload failed for ${file.name}: ${await res.text()}`).toBe(201);
    return res.json();
  }

  async function uploadResource(
    request: APIRequestContext,
    file: TestFile,
    pid: number = project1,
    name?: string,
  ): Promise<{ id: number; name: string; mime_type: string; file_size: number }> {
    const fd = new FormData();
    const blob = new Blob([file.content], { type: file.mime });
    fd.append("file", new File([blob], file.name, { type: file.mime }));
    fd.append("name", name || file.name);
    fd.append("resource_type", "document");
    fd.append("category", "RC-Test");
    const res = await request.post(`${API}/api/v1/resources/upload?project_id=${pid}`, {
      headers: auth(),
      multipart: fd as any,
    });
    expect(res.status(), `Resource upload failed for ${file.name}: ${await res.text()}`).toBe(201);
    return res.json();
  }

  // ════════════════════════════════════════════════════════
  // 1. UPLOAD VERIFICATION
  // ════════════════════════════════════════════════════════
  test.describe("1 — Upload Verification", () => {
    for (const file of ALL_FILES) {
      test(`Upload ${file.name} (${file.mime})`, async ({ request }) => {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        expect(result.name).toBe(file.name);
        expect(result.mime_type).toBe(file.mime);
        expect(result.size).toBeGreaterThan(0);
        expect(result.url).toContain("/api/v1/attachments/download/");
      });
    }

    test("Upload large file (2MB+ PNG)", async ({ request }) => {
      const result = await uploadAttachment(request, LARGE_FILE);
      uploadedAttachmentIds.push(result.id);
      expect(result.size).toBeGreaterThan(2 * 1024 * 1024);
      expect(result.name).toBe(LARGE_FILE.name);
    });

    test("Upload duplicate filename — same name creates new record", async ({ request }) => {
      const file = ALL_FILES[0];
      const r1 = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(r1.id);
      const r2 = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(r2.id);
      expect(r1.id).not.toBe(r2.id);
      expect(r1.name).toBe(r2.name);
    });

    test("Resource upload — all formats", async ({ request }) => {
      for (const file of ALL_FILES.slice(0, 10)) {
        const result = await uploadResource(request, file);
        uploadedResourceIds.push(result.id);
        expect(result.name).toBeTruthy();
        expect(result.file_size).toBeGreaterThan(0);
      }
    });

    test("Download attachment returns file bytes", async ({ request }) => {
      const id = uploadedAttachmentIds[0];
      const res = await request.get(`${API}/api/v1/attachments/download/${id}`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const body = await res.body();
      expect(body.length).toBeGreaterThan(0);
    });

    test("Download inline returns file bytes", async ({ request }) => {
      const id = uploadedAttachmentIds[0];
      const res = await request.get(`${API}/api/v1/attachments/download/${id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const body = await res.body();
      expect(body.length).toBeGreaterThan(0);
    });

    test("Delete attachment removes record and file", async ({ request }) => {
      const file = ALL_FILES[1];
      const uploaded = await uploadAttachment(request, file);

      const del = await request.delete(`${API}/api/v1/attachments/${uploaded.id}`, {
        headers: auth(),
      });
      expect(del.status()).toBe(200);

      const get = await request.get(`${API}/api/v1/attachments/download/${uploaded.id}`, {
        headers: auth(),
      });
      expect(get.status()).toBe(404);
    });

    test("Replace (upload new version of resource)", async ({ request }) => {
      const file = ALL_FILES[0];
      const resource = await uploadResource(request, file);

      const newFile: TestFile = { ...file, name: "design-hero-v2.png", content: makePng(200) };
      const fd = new FormData();
      const blob = new Blob([newFile.content], { type: newFile.mime });
      fd.append("file", new File([blob], newFile.name, { type: newFile.mime }));
      const v2 = await request.post(`${API}/api/v1/resources/${resource.id}/versions`, {
        headers: auth(),
        multipart: fd as any,
      });
      expect(v2.status()).toBe(201);
      const v2Body = await v2.json();
      expect(v2Body.current_version).toBe(2);
      uploadedResourceIds.push(resource.id);
    });

    test("Reject disallowed extension (.exe)", async ({ request }) => {
      const fd = new FormData();
      const blob = new Blob(["test"], { type: "application/x-executable" });
      fd.append("file", new File([blob], "malware.exe", { type: "application/x-executable" }));
      fd.append("model_type", "project");
      fd.append("model_id", String(project1));
      fd.append("collection_name", "design");
      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: auth(),
        multipart: fd as any,
      });
      expect(res.status()).toBe(400);
    });

    test("Reject oversized file (51MB > 50MB limit)", async ({ request }) => {
      const fd = new FormData();
      const blob = new Blob([Buffer.alloc(51 * 1024 * 1024, 0x41)], { type: "image/png" });
      fd.append("file", new File([blob], "huge.png", { type: "image/png" }));
      fd.append("model_type", "project");
      fd.append("model_id", String(project1));
      fd.append("collection_name", "design");
      const res = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: auth(),
        multipart: fd as any,
      });
      expect(res.status()).toBe(413);
    });
  });

  // ════════════════════════════════════════════════════════
  // 2. THUMBNAIL / PREVIEW ROUTING
  // ════════════════════════════════════════════════════════
  test.describe("2 — Preview Routing Verification", () => {
    test("Images (PNG/JPG/WEBP/SVG/GIF/BMP/ICO/TIFF) serve inline", async ({ request }) => {
      const imageFiles = ALL_FILES.filter((f) => f.category === "image");
      for (const file of imageFiles) {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        const res = await request.get(
          `${API}/api/v1/attachments/download/${result.id}?inline=true`,
          { headers: auth() },
        );
        expect(res.status(), `Inline failed for ${file.name}`).toBe(200);
        const ct = res.headers()["content-type"] || res.headers()["content-type"];
        expect(ct, `No content-type for ${file.name}`).toBeTruthy();
      }
    });

    test("PDF serves inline for iframe rendering", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "report.pdf")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const body = await res.body();
      expect(body.toString("ascii").substring(0, 5)).toBe("%PDF-");
    });

    test("JSON serves inline for syntax-highlighted preview", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "design.json")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const text = await res.text();
      expect(text).toContain('"name"');
    });

    test("Markdown serves inline for rendered preview", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "readme.md")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const text = await res.text();
      expect(text).toContain("Hello World");
    });

    test("CSV serves inline for table rendering", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "data.csv")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const text = await res.text();
      expect(text).toContain("name,age,city");
    });

    test("Text serves inline for monospace rendering", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "notes.txt")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}?inline=true`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const text = await res.text();
      expect(text).toContain("Lorem ipsum");
    });

    test("Office docs (PPTX/XLSX) serve for preview card", async ({ request }) => {
      const officeFiles = ALL_FILES.filter((f) => f.category === "office");
      for (const file of officeFiles) {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        const res = await request.get(`${API}/api/v1/attachments/download/${result.id}`, {
          headers: auth(),
        });
        expect(res.status(), `Download failed for ${file.name}`).toBe(200);
        expect((await res.body()).length).toBeGreaterThan(0);
      }
    });

    test("Design files (PSD/AI/EPS/FIG/XD/Sketch) serve for icon preview", async ({ request }) => {
      const designFiles = ALL_FILES.filter((f) => f.category === "design");
      for (const file of designFiles) {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        const res = await request.get(`${API}/api/v1/attachments/download/${result.id}`, {
          headers: auth(),
        });
        expect(res.status(), `Download failed for ${file.name}`).toBe(200);
      }
    });

    test("Video (MP4/MOV) serves for native player preview", async ({ request }) => {
      const videoFiles = ALL_FILES.filter((f) => f.mime.startsWith("video/"));
      for (const file of videoFiles) {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        const res = await request.get(
          `${API}/api/v1/attachments/download/${result.id}?inline=true`,
          { headers: auth() },
        );
        expect(res.status(), `Inline failed for ${file.name}`).toBe(200);
      }
    });

    test("Audio (MP3/WAV) serves for native player preview", async ({ request }) => {
      const audioFiles = ALL_FILES.filter((f) => f.mime.startsWith("audio/"));
      for (const file of audioFiles) {
        const result = await uploadAttachment(request, file);
        uploadedAttachmentIds.push(result.id);
        const res = await request.get(
          `${API}/api/v1/attachments/download/${result.id}?inline=true`,
          { headers: auth() },
        );
        expect(res.status(), `Inline failed for ${file.name}`).toBe(200);
      }
    });

    test("ZIP serves for fallback preview with download button", async ({ request }) => {
      const file = ALL_FILES.find((f) => f.name === "archive.zip")!;
      const result = await uploadAttachment(request, file);
      uploadedAttachmentIds.push(result.id);
      const res = await request.get(`${API}/api/v1/attachments/download/${result.id}`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      expect((await res.body()).length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 3. BROWSER REFRESH PERSISTENCE
  // ════════════════════════════════════════════════════════
  test.describe("3 — Browser Refresh Persistence", () => {
    let persistedAttachmentId: number;
    let persistedResourceId: number;

    test("Upload file and record IDs", async ({ request }) => {
      const result = await uploadAttachment(request, ALL_FILES[0]);
      persistedAttachmentId = result.id;
      uploadedAttachmentIds.push(result.id);

      const resource = await uploadResource(
        request,
        ALL_FILES.find((f) => f.name === "report.pdf")!,
      );
      persistedResourceId = resource.id;
      uploadedResourceIds.push(resource.id);
    });

    test("After 'refresh' — attachment download still works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/attachments/download/${persistedAttachmentId}`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      expect((await res.body()).length).toBeGreaterThan(0);
    });

    test("After 'refresh' — attachment inline preview still works", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${persistedAttachmentId}?inline=true`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
    });

    test("After 'refresh' — resource download still works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${persistedResourceId}/file`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
    });

    test("After 'refresh' — resource inline still works", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/resources/${persistedResourceId}/file?inline=true`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
    });

    test("After 'refresh' — delete still works", async ({ request }) => {
      const file = ALL_FILES[2];
      const result = await uploadAttachment(request, file);
      const del = await request.delete(`${API}/api/v1/attachments/${result.id}`, {
        headers: auth(),
      });
      expect(del.status()).toBe(200);
      const get = await request.get(`${API}/api/v1/attachments/download/${result.id}`, {
        headers: auth(),
      });
      expect(get.status()).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // 4. PROJECT SWITCHING ISOLATION
  // ════════════════════════════════════════════════════════
  test.describe("4 — Project Switching Isolation", () => {
    let p1AttachmentId: number;
    let p2AttachmentId: number;
    let p1ResourceId: number;
    let p2ResourceId: number;

    test("Upload to project 1", async ({ request }) => {
      const result = await uploadAttachment(request, ALL_FILES[0], project1);
      p1AttachmentId = result.id;
      uploadedAttachmentIds.push(result.id);
      expect(result.model_id).toBe(project1);
    });

    test("Upload to project 2", async ({ request }) => {
      expect(project2).toBeTruthy();
      const result = await uploadAttachment(request, ALL_FILES[1], project2);
      p2AttachmentId = result.id;
      uploadedAttachmentIds.push(result.id);
      expect(result.model_id).toBe(project2);
    });

    test("Project 1 does not see project 2 attachments", async ({ request }) => {
      expect(project2).toBeTruthy();
      const res = await request.get(`${API}/api/v1/attachments`, {
        headers: auth(),
        params: {
          model_type: "project",
          model_id: project1,
          collection_name: "design",
          per_page: 100,
        },
      });
      const body = await res.json();
      const ids = (body.items || []).map((a: any) => a.id);
      expect(ids).not.toContain(p2AttachmentId);
    });

    test("Project 2 does not see project 1 attachments", async ({ request }) => {
      expect(project2).toBeTruthy();
      const res = await request.get(`${API}/api/v1/attachments`, {
        headers: auth(),
        params: {
          model_type: "project",
          model_id: project2,
          collection_name: "design",
          per_page: 100,
        },
      });
      const body = await res.json();
      const ids = (body.items || []).map((a: any) => a.id);
      expect(ids).not.toContain(p1AttachmentId);
    });

    test("Upload resource to project 1", async ({ request }) => {
      const resource = await uploadResource(request, ALL_FILES[3], project1);
      p1ResourceId = resource.id;
      uploadedResourceIds.push(resource.id);
    });

    test("Upload resource to project 2", async ({ request }) => {
      expect(project2).toBeTruthy();
      const resource = await uploadResource(request, ALL_FILES[4], project2);
      p2ResourceId = resource.id;
      uploadedResourceIds.push(resource.id);
    });

    test("Project 1 resources don't appear in project 2", async ({ request }) => {
      expect(project2).toBeTruthy();
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: auth(),
        params: { project_id: project2 },
      });
      const body = await res.json();
      const ids = (body.items || []).map((r: any) => r.id);
      expect(ids).toContain(p2ResourceId);
      expect(ids).not.toContain(p1ResourceId);
    });

    test("Figma connection isolated — project 1 token doesn't leak to project 2", async ({
      request,
    }) => {
      expect(project2).toBeTruthy();
      await request.put(`${API}/api/v1/projects/${project1}`, {
        headers: auth(),
        data: {
          figma_url: "https://www.figma.com/file/test123/Test",
          figma_token: "figd_p1_secret",
        },
      });
      if (project2) {
        await request.put(`${API}/api/v1/projects/${project2}`, {
          headers: auth(),
          data: {
            figma_url: "https://www.figma.com/file/test456/Test2",
            figma_token: "figd_p2_secret",
          },
        });
      }

      const p1 = await request.get(`${API}/api/v1/projects/${project1}`, { headers: auth() });
      const p1Body = await p1.json();
      expect(p1Body.figma_token).toBe("figd_p1_secret");

      const p2 = await request.get(`${API}/api/v1/projects/${project2}`, { headers: auth() });
      const p2Body = await p2.json();
      expect(p2Body.figma_token).toBe("figd_p2_secret");

      await request.put(`${API}/api/v1/projects/${project1}`, {
        headers: auth(),
        data: { figma_url: null, figma_token: null },
      });
      await request.put(`${API}/api/v1/projects/${project2}`, {
        headers: auth(),
        data: { figma_url: null, figma_token: null },
      });
    });
  });

  // ════════════════════════════════════════════════════════
  // 5. BACKEND HEADERS
  // ════════════════════════════════════════════════════════
  test.describe("5 — Backend Headers", () => {
    let headerTestAttachmentId: number;
    let headerTestResourceId: number;

    test.beforeAll(async ({ request }) => {
      const login = await request.post(`${API}/api/v1/auth/login`, {
        data: { email: "admin@company.com", password: "password" },
      });
      const loginBody = await login.json();
      const token = loginBody.access_token;

      const result = await request.post(`${API}/api/v1/attachments/upload`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: (() => {
          const fd = new FormData();
          const blob = new Blob([makePng(10)], { type: "image/png" });
          fd.append("file", new File([blob], "header-test.png", { type: "image/png" }));
          fd.append("model_type", "project");
          fd.append("model_id", "1");
          fd.append("collection_name", "design");
          return fd as any;
        })(),
      });
      const body = await result.json();
      headerTestAttachmentId = body.id;

      const fd = new FormData();
      const blob = new Blob([makeText()], { type: "text/plain" });
      fd.append("file", new File([blob], "header-test.txt", { type: "text/plain" }));
      fd.append("name", "header-test.txt");
      fd.append("resource_type", "document");
      const resResult = await request.post(`${API}/api/v1/resources/upload?project_id=1`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: fd as any,
      });
      const resBody = await resResult.json();
      headerTestResourceId = resBody.id;
    });

    test("Attachment download has correct Content-Type for PNG", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const ct = res.headers()["content-type"];
      expect(ct).toContain("image/png");
    });

    test("Attachment download inline has Content-Disposition: inline", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}?inline=true`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const cd = res.headers()["content-disposition"] || "";
      expect(cd).toContain("inline");
    });

    test("Attachment download non-inline has Content-Disposition: attachment", async ({
      request,
    }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const cd = res.headers()["content-disposition"] || "";
      expect(cd).toContain("header-test.png");
    });

    test("Resource file download has correct Content-Type", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${headerTestResourceId}/file`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const ct = res.headers()["content-type"];
      expect(ct).toContain("text/plain");
    });

    test("Resource file download inline has Content-Disposition: inline", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/resources/${headerTestResourceId}/file?inline=true`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const cd = res.headers()["content-disposition"] || "";
      expect(cd).toContain("inline");
    });

    test("Attachment download without auth returns 403", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/attachments/download/${headerTestAttachmentId}`);
      expect([401, 403]).toContain(res.status());
    });

    test("Attachment upload without auth returns 403", async ({ request }) => {
      const fd = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      fd.append("file", new File([blob], "test.txt", { type: "text/plain" }));
      fd.append("model_type", "project");
      fd.append("model_id", "1");
      fd.append("collection_name", "design");
      const res = await request.post(`${API}/api/v1/attachments/upload`, { multipart: fd as any });
      expect([401, 403]).toContain(res.status());
    });

    test("Resource download without auth returns 403", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${headerTestResourceId}/file`);
      expect([401, 403]).toContain(res.status());
    });

    test("Attachment inline has Cache-Control: private, max-age=3600", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}?inline=true`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const cc = res.headers()["cache-control"];
      expect(cc).toContain("private");
      expect(cc).toContain("max-age=3600");
    });

    test("Attachment download has Cache-Control: private, max-age=0", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const cc = res.headers()["cache-control"];
      expect(cc).toContain("private");
      expect(cc).toContain("max-age=0");
    });

    test("Attachment has ETag header", async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/attachments/download/${headerTestAttachmentId}`,
        { headers: auth() },
      );
      expect(res.status()).toBe(200);
      const etag = res.headers()["etag"];
      expect(etag).toBeTruthy();
      expect(etag).toMatch(/^".+"$/);
    });

    test("Resource file has Cache-Control header", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${headerTestResourceId}/file`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const cc = res.headers()["cache-control"];
      expect(cc).toBeTruthy();
    });

    test("Resource file has ETag header", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/${headerTestResourceId}/file`, {
        headers: auth(),
      });
      expect(res.status()).toBe(200);
      const etag = res.headers()["etag"];
      expect(etag).toBeTruthy();
      expect(etag).toMatch(/^".+"$/);
    });

    test("Download non-existent attachment returns 404", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/attachments/download/999999`, {
        headers: auth(),
      });
      expect(res.status()).toBe(404);
    });

    test("Download non-existent resource returns 404", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources/999999/file`, { headers: auth() });
      expect(res.status()).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // 6. PERFORMANCE
  // ════════════════════════════════════════════════════════
  test.describe("6 — Performance", () => {
    test("No duplicate downloads — same file returns same bytes", async ({ request }) => {
      const id = uploadedAttachmentIds[0];
      if (!id) return;
      const r1 = await request.get(`${API}/api/v1/attachments/download/${id}`, { headers: auth() });
      const b1 = await r1.body();
      const r2 = await request.get(`${API}/api/v1/attachments/download/${id}`, { headers: auth() });
      const b2 = await r2.body();
      expect(b1.length).toBe(b2.length);
      expect(Buffer.compare(b1, b2)).toBe(0);
    });

    test("Attachment list pagination works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/attachments`, {
        headers: auth(),
        params: {
          model_type: "project",
          model_id: project1,
          collection_name: "design",
          page: 1,
          per_page: 5,
        },
      });
      const body = await res.json();
      expect(body.items).toBeDefined();
      expect(body.total).toBeGreaterThanOrEqual(0);
      expect(body.per_page).toBe(5);
      expect(body.page).toBe(1);
    });

    test("Resource list pagination works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: auth(),
        params: { project_id: project1, page: 1, per_page: 5 },
      });
      const body = await res.json();
      expect(body.items).toBeDefined();
      expect(body.per_page).toBe(5);
    });

    test("Resource search filter works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: auth(),
        params: { project_id: project1, search: "report" },
      });
      const body = await res.json();
      expect(body.items).toBeDefined();
    });

    test("Resource sort alphabetical works", async ({ request }) => {
      const res = await request.get(`${API}/api/v1/resources`, {
        headers: auth(),
        params: { project_id: project1, sort_by: "alphabetical" },
      });
      const body = await res.json();
      expect(body.items).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════
  // CLEANUP
  // ════════════════════════════════════════════════════════
  test.describe("7 — Cleanup", () => {
    test("Delete all test attachments", async ({ request }) => {
      for (const id of uploadedAttachmentIds) {
        await request.delete(`${API}/api/v1/attachments/${id}`, { headers: auth() });
      }
    });

    test("Delete all test resources", async ({ request }) => {
      for (const id of uploadedResourceIds) {
        await request.delete(`${API}/api/v1/resources/${id}`, { headers: auth() });
      }
    });
  });
});
