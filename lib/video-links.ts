export type VideoProvider = "youtube" | "vimeo";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  canonicalUrl: string;
  embedUrl: string;
  posterUrl: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseVideoUrl(input: string): ParsedVideo | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    return youtube(url.pathname.split("/").filter(Boolean)[0]);
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (url.searchParams.get("v")) return youtube(url.searchParams.get("v"));
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live" || parts[0] === "v") return youtube(parts[1]);
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const ids = url.pathname.split("/").filter((part) => /^\d{6,12}$/.test(part));
    return vimeo(ids[ids.length - 1]);
  }
  return null;
}

function youtube(id: string | null | undefined): ParsedVideo | null {
  if (!id || !YOUTUBE_ID.test(id)) return null;
  return {
    provider: "youtube",
    id,
    canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function vimeo(id: string | undefined): ParsedVideo | null {
  if (!id) return null;
  return {
    provider: "vimeo",
    id,
    canonicalUrl: `https://vimeo.com/${id}`,
    embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
    posterUrl: "",
  };
}

export type EmbedStatus = "ok" | "unavailable" | "private" | "embed_disabled" | "unchecked";

export function embedStatusFromHttp(status: number): EmbedStatus {
  if (status === 200) return "ok";
  if (status === 401) return "embed_disabled";
  if (status === 403) return "private";
  if (status === 404 || status === 410) return "unavailable";
  return "unchecked";
}

export function embedStatusLabel(status: string): string {
  if (status === "embed_disabled") return "Embedding is switched off";
  if (status === "private") return "Private or blocked";
  if (status === "unavailable") return "Unavailable";
  if (status === "ok") return "Embeds";
  return "Not checked yet";
}

export function oEmbedEndpoint(video: { provider: string; canonicalUrl: string }): string | null {
  if (video.provider === "youtube") {
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(video.canonicalUrl)}`;
  }
  if (video.provider === "vimeo") {
    return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(video.canonicalUrl)}`;
  }
  return null;
}

export function countsAsVideo(video: { remoteId?: string; status: string }): boolean {
  if (video.status === "failed") return false;
  return Boolean(video.remoteId) || video.status === "ready" || video.status === "example";
}

export function posterFor(video: { provider?: string; remoteId?: string; posterPath?: string }): string {
  if (video.provider === "vimeo") return video.posterPath || "";
  if (video.remoteId && video.provider !== "vimeo") return `https://i.ytimg.com/vi/${video.remoteId}/hqdefault.jpg`;
  return video.posterPath || "";
}
