import { createReadStream, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { Readable } from "node:stream";

import archiver from "archiver";
import { NextResponse } from "next/server";

import { getFfmpegBinaryPath } from "@/lib/ffmpeg-path";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { spawnYtDlp } from "@/lib/yt-dlp";

export const runtime = "nodejs";
/** Large local batches can run a long time (many tracks × encode). */
export const maxDuration = 3600;

function getMaxTracks(): number {
  const n = parseInt(process.env.MIX_MAX_TRACKS ?? "50", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 50;
}

function runYtDlp(
  url: string,
  outDir: string,
  maxTracks: number,
  ffmpeg: string,
): Promise<void> {
  const args: string[] = [
    "--ffmpeg-location",
    ffmpeg,
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "-o",
    join(outDir, "%(id)s.%(ext)s"),
    "--playlist-end",
    String(maxTracks),
    "--no-playlist-reverse",
    "--newline",
    "--progress",
    url,
  ];
  return spawnYtDlp(args, {
    logStderrToConsole:
      process.env.NODE_ENV === "development" ||
      process.env.MIXGRAB_LOG_YTDLP === "1",
  });
}

export async function POST(req: Request) {
  let tmp: string | null = null;
  try {
    const body = (await req.json()) as { url?: string };
    const url = typeof body.url === "string" ? body.url : "";
    if (!url.trim()) {
      return NextResponse.json({ error: "Missing url." }, { status: 400 });
    }

    const parsed = parseYouTubeUrl(url);
    if (!parsed?.listId) {
      return NextResponse.json(
        {
          error:
            "Need a playlist / Mix URL with list=… (for example the watch URL that includes &list=RD…).",
        },
        { status: 400 },
      );
    }

    const canonical =
      parsed.videoId && parsed.listId
        ? `https://www.youtube.com/watch?v=${parsed.videoId}&list=${parsed.listId}`
        : `https://www.youtube.com/playlist?list=${parsed.listId}`;

    tmp = mkdtempSync(join(tmpdir(), "mixdl-"));
    const maxTracks = getMaxTracks();
    const ffmpeg = getFfmpegBinaryPath();
    if (!ffmpeg) {
      return NextResponse.json(
        {
          error:
            "ffmpeg not found. Install it (e.g. winget install Gyan.FFmpeg), restart the terminal, then `npm run dev`. Or set FFMPEG_PATH in .env.local to the full path of ffmpeg.exe",
        },
        { status: 500 },
      );
    }
    await runYtDlp(canonical, tmp, maxTracks, ffmpeg);

    const files = readdirSync(tmp).filter(
      (f) => f.endsWith(".mp3") || f.endsWith(".m4a") || f.endsWith(".opus"),
    );
    if (!files.length) {
      return NextResponse.json(
        {
          error:
            "No audio files were produced. Install ffmpeg, verify yt-dlp works from a terminal, and try again.",
        },
        { status: 500 },
      );
    }

    const pass = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => pass.destroy(err));
    archive.pipe(pass);

    const cleanup = () => {
      if (tmp) {
        try {
          rmSync(tmp, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
        tmp = null;
      }
    };

    archive.on("end", cleanup);
    archive.on("warning", (err) => {
      if ((err as { code?: string }).code !== "ENOENT") pass.destroy(err);
    });

    for (const name of files) {
      const full = join(tmp, name);
      archive.append(createReadStream(full), { name });
    }

    void archive.finalize();

    const webStream = Readable.toWeb(pass) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="youtube-mix-audio.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (tmp) {
      try {
        rmSync(tmp, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
    const message = e instanceof Error ? e.message : "Download failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
