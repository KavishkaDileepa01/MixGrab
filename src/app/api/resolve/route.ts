import { NextResponse } from "next/server";

import { normalizeYouTubePaste } from "@/lib/youtube-url";
import { resolvePlaylist } from "@/lib/resolve-playlist";

export const runtime = "nodejs";

const RESOLVE_MS = 90_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = normalizeYouTubePaste(typeof body.url === "string" ? body.url : "");
    if (!url) {
      return NextResponse.json({ error: "Missing url." }, { status: 400 });
    }

    const playlist = await withTimeout(
      resolvePlaylist(url),
      RESOLVE_MS,
      "Resolving the playlist took too long. Check your network, try again, or install yt-dlp for a more reliable fallback.",
    );

    if (!playlist.tracks.length) {
      return NextResponse.json(
        {
          error:
            "No tracks were returned for that link. Make sure the URL includes a full playlist id (list=…) and is not cut off.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(playlist);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve playlist.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
