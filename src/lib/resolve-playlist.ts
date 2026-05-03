import Innertube, { YTNodes } from "youtubei.js";

import { parseYouTubeUrl } from "./youtube-url";
import { execYtDlp } from "./yt-dlp";

export type PlaylistTrack = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
};

export type ResolvedPlaylist = {
  title: string;
  subtitle: string | null;
  url: string;
  tracks: PlaylistTrack[];
};

function bestThumbnail(urls: { url?: string }[]): string {
  if (!urls?.length) return "";
  const last = urls[urls.length - 1];
  return last?.url ?? "";
}

type YoutubePlaylist = Awaited<
  ReturnType<InstanceType<typeof Innertube>["getPlaylist"]>
>;

async function collectPlaylistVideos(
  first: YoutubePlaylist,
): Promise<{ info: YoutubePlaylist["info"]; tracks: PlaylistTrack[] }> {
  const info = first.info;
  const tracks: PlaylistTrack[] = [];
  let playlist: YoutubePlaylist | undefined = first;

  const flush = (pl: YoutubePlaylist) => {
    for (const item of pl.items) {
      if (!item.is(YTNodes.PlaylistVideo)) continue;
      tracks.push({
        id: item.id,
        title: item.title?.text ?? String(item.title ?? ""),
        channel: item.author?.name ?? "",
        duration: item.duration?.text ?? "",
        durationSeconds: item.duration?.seconds ?? 0,
        thumbnail: bestThumbnail(item.thumbnails as { url?: string }[]),
      });
    }
  };

  flush(first);
  while (playlist?.has_continuation) {
    playlist = await playlist.getContinuation();
    flush(playlist);
  }

  return { info, tracks };
}

function dedupeTracks(tracks: PlaylistTrack[]): PlaylistTrack[] {
  const seen = new Set<string>();
  const out: PlaylistTrack[] = [];
  for (const t of tracks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

async function resolveWithInnertube(listId: string, sourceUrl: string) {
  const yt = await Innertube.create();
  const pl = await yt.getPlaylist(listId);
  const { info, tracks } = await collectPlaylistVideos(pl);
  const title = info.title ? String(info.title) : "Playlist";
  const subtitle = info.subtitle ? info.subtitle.toString() : null;

  return {
    title,
    subtitle,
    url: sourceUrl,
    tracks: dedupeTracks(tracks),
  } satisfies ResolvedPlaylist;
}

type YtDlpFlatEntry = {
  id?: string;
  title?: string;
  duration?: number;
  channel?: string;
  uploader?: string;
  thumbnails?: { url?: string }[];
};

type YtDlpFlatJson = {
  title?: string;
  id?: string;
  entries?: YtDlpFlatEntry[];
};

export async function resolveWithYtDlp(url: string): Promise<ResolvedPlaylist> {
  const { stdout } = await execYtDlp(
    ["--flat-playlist", "--dump-single-json", "--no-warnings", "--skip-download", url],
    { maxBuffer: 50 * 1024 * 1024 },
  );

  const data = JSON.parse(stdout) as YtDlpFlatJson;
  const entries = data.entries ?? [];
  const tracks: PlaylistTrack[] = [];

  for (const e of entries) {
    if (!e.id) continue;
    tracks.push({
      id: e.id,
      title: e.title ?? "Unknown title",
      channel: e.channel ?? e.uploader ?? "",
      duration:
        typeof e.duration === "number" ? formatDuration(e.duration) : "",
      durationSeconds: typeof e.duration === "number" ? e.duration : 0,
      thumbnail: bestThumbnail(e.thumbnails ?? []),
    });
  }

  return {
    title: data.title ?? "YouTube playlist",
    subtitle: null,
    url,
    tracks: dedupeTracks(tracks),
  };
}

function formatDuration(seconds: number): string {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** YouTube "Mix" and radio playlists use list IDs like RD… — InnerTube often returns "unviewable". yt-dlp handles them. */
function shouldTryYtDlpFirst(listId: string): boolean {
  return listId.startsWith("RD");
}

function combineErrors(a: unknown, b: unknown): Error {
  const msgA = a instanceof Error ? a.message : String(a);
  const msgB = b instanceof Error ? b.message : String(b);
  /** Help is already included in yt-dlp ENOENT errors; do not append twice. */
  return new Error(`${msgA}\n\n---\n${msgB}`);
}

export async function resolvePlaylist(inputUrl: string): Promise<ResolvedPlaylist> {
  const parsed = parseYouTubeUrl(inputUrl);
  if (!parsed) {
    throw new Error("That does not look like a valid YouTube URL.");
  }

  const { listId, videoId, pageUrl } = parsed;
  const canonical =
    listId && videoId
      ? `https://www.youtube.com/watch?v=${videoId}&list=${listId}`
      : listId
        ? `https://www.youtube.com/playlist?list=${listId}`
        : videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : pageUrl;

  if (!listId) {
    throw new Error(
      "No playlist ID found. Paste a Mix or playlist URL that contains a list=… parameter (for example a watch URL with &list=RD…).",
    );
  }

  if (shouldTryYtDlpFirst(listId)) {
    try {
      return await resolveWithYtDlp(canonical);
    } catch (yErr) {
      try {
        return await resolveWithInnertube(listId, canonical);
      } catch (iErr) {
        throw combineErrors(yErr, iErr);
      }
    }
  }

  try {
    return await resolveWithInnertube(listId, canonical);
  } catch (iErr) {
    try {
      return await resolveWithYtDlp(canonical);
    } catch (yErr) {
      throw combineErrors(iErr, yErr);
    }
  }
}
