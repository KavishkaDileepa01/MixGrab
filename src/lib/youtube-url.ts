const YT_HOSTS = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)/i;

/** Strip invisible chars / odd spaces from pasted URLs so list= and v= parse reliably */
export function normalizeYouTubePaste(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim();
}

export type ParsedYouTubeInput = {
  listId: string | null;
  videoId: string | null;
  pageUrl: string;
};

function extractParam(url: URL, key: string): string | null {
  return url.searchParams.get(key);
}

export function parseYouTubeUrl(raw: string): ParsedYouTubeInput | null {
  const trimmed = normalizeYouTubePaste(raw);
  if (!trimmed) return null;

  let urlStr = trimmed;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return null;
  }

  if (!YT_HOSTS.test(url.hostname.replace(/^www\./, ""))) {
    return null;
  }

  let listId = extractParam(url, "list");
  let videoId = extractParam(url, "v");

  if (url.hostname.includes("youtu.be")) {
    const pathId = url.pathname.replace(/^\//, "").split("/")[0];
    if (pathId && /^[\w-]{11}$/.test(pathId)) {
      videoId = pathId;
    }
  }

  if (url.pathname.includes("/playlist")) {
    listId = listId || extractParam(url, "list");
  }

  const pageUrl = trimmed.startsWith("http")
    ? trimmed
    : urlStr.replace(/^https:\/\//, "https://");

  return {
    listId,
    videoId,
    pageUrl,
  };
}

export function buildWatchUrl(videoId: string, listId?: string | null): string {
  const base = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  if (listId) {
    return `${base}&list=${encodeURIComponent(listId)}`;
  }
  return base;
}
