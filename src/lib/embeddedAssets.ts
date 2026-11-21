interface EmbeddedAssetEntry {
  mime: string;
  b64: string;
}

declare global {
  interface Window {
    __EMBEDDED_ASSETS__?: Record<string, EmbeddedAssetEntry>;
  }
}

const blobUrlCache = new Map<string, string>();

function normalizeAssetKey(path: string): string {
  return path.split('?')[0];
}

function decodeBase64ToBlobUrl(entry: EmbeddedAssetEntry): string {
  const binary = atob(entry.b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: entry.mime });
  return URL.createObjectURL(blob);
}

/**
 * Resolves a public asset URL. When running from the standalone single-file
 * `index.html`, decodes the embedded base64 payload into a fast in-memory Blob
 * URL so `<video>`, `<img>`, and MapLibre `image` sources work identically both
 * online and offline (`file://`).
 */
export function resolveAssetUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const registry = window.__EMBEDDED_ASSETS__;
  if (!registry) return path;

  const key = normalizeAssetKey(path);
  const cached = blobUrlCache.get(key);
  if (cached) return cached;

  const entry = registry[key];
  if (!entry) return path;

  const blobUrl = decodeBase64ToBlobUrl(entry);
  blobUrlCache.set(key, blobUrl);
  return blobUrl;
}
