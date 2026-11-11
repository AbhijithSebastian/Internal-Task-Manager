import { useState, useEffect } from "react";
import axios from "axios";

const authClient = axios.create();
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UseAuthenticatedResourceResult {
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
  fetchDownload: (filename?: string) => Promise<void>;
}

export function useAuthenticatedResource(
  url: string | null | undefined,
): UseAuthenticatedResourceResult {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const targetUrl = url;

    async function fetchResource() {
      setLoading(true);
      setError(null);

      try {
        const res = await authClient.get(targetUrl, {
          responseType: "blob",
          signal: controller.signal,
        });
        const ct =
          typeof res.headers["content-type"] === "string"
            ? res.headers["content-type"]
            : "application/octet-stream";
        const blob = new Blob([res.data], { type: ct });
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);
      } catch (err: unknown) {
        if (axios.isCancel(err) || (err as Error)?.name === "CanceledError") return;
        setError(err instanceof Error ? err.message : "Failed to load resource");
      } finally {
        setLoading(false);
      }
    }

    fetchResource();

    return () => {
      controller.abort();
    };
  }, [url]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const fetchDownload = async (filename?: string) => {
    if (!url) return;
    try {
      const res = await authClient.get(url, {
        responseType: "blob",
      });
      const disposition =
        typeof res.headers["content-disposition"] === "string"
          ? res.headers["content-disposition"]
          : undefined;
      let downloadName = filename;
      if (!downloadName && disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) downloadName = match[1];
      }
      const ct =
        typeof res.headers["content-type"] === "string"
          ? res.headers["content-type"]
          : "application/octet-stream";
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: ct }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return { blobUrl, loading, error, fetchDownload };
}
