"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Download,
  FileAudio,
  Headphones,
  Infinity as InfinityIcon,
  Info,
  Loader2,
  MoreVertical,
  Music2,
  Play,
  X,
  CloudDownload,
} from "lucide-react";
import { normalizeYouTubePaste } from "@/lib/youtube-url";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const CLIENT_RESOLVE_MS = 95_000;

function YoutubeGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  );
}

type Track = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
};

type PlaylistPayload = {
  title: string;
  subtitle: string | null;
  url: string;
  tracks: Track[];
};

const brand = "MixGrab";

export default function Home() {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipElapsedSec, setZipElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlaylistPayload | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  useEffect(() => {
    if (data?.tracks.length && resultCardRef.current) {
      resultCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [data]);

  useEffect(() => {
    if (!zipBusy) {
      setZipElapsedSec(0);
      return;
    }
    const started = Date.now();
    const tick = () =>
      setZipElapsedSec(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [zipBusy]);

  const loadPlaylist = useCallback(async () => {
    const fromInput = normalizeYouTubePaste(urlInputRef.current?.value ?? "");
    const normalized = fromInput || normalizeYouTubePaste(url);
    if (!normalized) {
      setError(
        "Paste a full YouTube Mix or playlist URL first (it must include list=…).",
      );
      return;
    }
    setUrl(normalized);
    setError(null);
    setBusy(true);
    setData(null);

    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), CLIENT_RESOLVE_MS);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
        signal: controller.signal,
      });

      const text = await res.text();
      let payload: PlaylistPayload & { error?: string };
      try {
        payload = (
          text ? JSON.parse(text) : {}
        ) as PlaylistPayload & { error?: string };
      } catch {
        throw new Error(
          res.ok
            ? "Unexpected response from server."
            : `Server error (${res.status}). Check the terminal running Next.js.`,
        );
      }

      if (!res.ok) {
        throw new Error(payload.error ?? "Could not load that playlist.");
      }

      setData({
        title: payload.title,
        subtitle: payload.subtitle,
        url: payload.url,
        tracks: payload.tracks,
      });
      setActive(0);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError(
          "Request timed out. YouTube may be slow to reach from this machine — try again or run yt-dlp from a terminal to verify connectivity.",
        );
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      window.clearTimeout(tid);
      setBusy(false);
    }
  }, [url]);

  const downloadZip = useCallback(async () => {
    if (!data?.url) return;
    setZipBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Download failed.";
        try {
          const j = text ? (JSON.parse(text) as { error?: string }) : {};
          msg = j.error ?? msg;
        } catch {
          msg = text.slice(0, 200) || msg;
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "youtube-mix-audio.zip";
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setZipBusy(false);
    }
  }, [data]);

  const clearPlaylist = useCallback(() => {
    setData(null);
    setError(null);
    setActive(0);
  }, []);

  const scrollToSection = useCallback(
    (id: string, e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [],
  );

  return (
    <div className="flex min-h-full flex-col bg-black">
      {/* Top bar */}
      <header className="sticky top-0 z-[100] border-b border-[#0069d9]/30 bg-[#007bff] text-white shadow-md shadow-black/30">
        <div className="relative z-[100] mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="relative z-[100] flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <InfinityIcon className="size-5" aria-hidden strokeWidth={2.5} />
            </span>
            <span className="text-lg font-semibold tracking-tight">{brand}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium uppercase tracking-wide text-white/95 md:flex lg:gap-8">
            <a
              href="#resources"
              onClick={(e) => scrollToSection("resources", e)}
              className="cursor-pointer transition-colors hover:text-white/80"
            >
              Resources
            </a>
            <a
              href="#how"
              onClick={(e) => scrollToSection("how", e)}
              className="cursor-pointer transition-colors hover:text-white/80"
            >
              How it works
            </a>
            <a
              href="#copyright"
              onClick={(e) => scrollToSection("copyright", e)}
              className="cursor-pointer transition-colors hover:text-white/80"
            >
              Copyright
            </a>
          </nav>
          <div className="relative z-[100] flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="#download"
              onClick={(e) => scrollToSection("download", e)}
              className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#007bff] shadow transition-transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            >
              Try free
            </a>
            <Link
              href="/login"
              className="text-sm text-white/95 underline-offset-4 hover:text-white hover:underline"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/50 bg-transparent px-3 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <div className="relative flex-1 bg-grid-dark">
        <div
          className="home-ambient pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(0, 123, 255, 0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 40%, rgba(56, 189, 248, 0.12), transparent 45%), radial-gradient(ellipse 45% 35% at 0% 70%, rgba(139, 92, 246, 0.1), transparent 45%)",
          }}
          aria-hidden
        />
        <main
          id="download"
          className="relative mx-auto max-w-6xl scroll-mt-[72px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16"
        >
          {/* Process icons */}
          <div className="mb-8 flex animate-fade-in flex-wrap items-center justify-center gap-2 sm:mb-10 sm:gap-3">
            <div
              className="animate-icon-pop flex size-14 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/40 transition-transform duration-300 hover:scale-110 hover:shadow-red-500/50"
              style={{ animationDelay: "0ms" }}
            >
              <YoutubeGlyph className="size-8" />
            </div>
            <ArrowRight
              className="size-5 text-sky-400 opacity-80 sm:size-6"
              aria-hidden
            />
            <div
              className="animate-icon-pop flex size-14 items-center justify-center rounded-2xl bg-[#007bff] text-white shadow-lg shadow-blue-500/40 transition-transform duration-300 hover:scale-110 hover:shadow-blue-400/50"
              style={{ animationDelay: "80ms" }}
            >
              <CloudDownload className="size-7" aria-hidden strokeWidth={2.25} />
            </div>
            <ArrowRight
              className="size-5 text-sky-400 opacity-80 sm:size-6"
              aria-hidden
            />
            <div
              className="animate-icon-pop flex size-14 items-center justify-center rounded-2xl bg-sky-400 text-white shadow-lg shadow-sky-400/35 transition-transform duration-300 hover:scale-110 hover:shadow-sky-400/50"
              style={{ animationDelay: "160ms" }}
            >
              <FileAudio className="size-7" aria-hidden strokeWidth={2.25} />
            </div>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.5rem] md:leading-tight">
              Free YouTube Mix to MP3 Downloader
            </h1>
            <p className="animate-fade-in-up mt-3 text-pretty text-base text-zinc-400 sm:text-lg">
              Download an entire YouTube Mix as MP3 files in one ZIP — preview
              every track first.
            </p>
          </div>

          {/* Input + CTA (TurboScribe-style combined control) */}
          <div className="mx-auto mt-10 max-w-3xl animate-fade-in-up stagger-1">
            <div
              className="group flex flex-col overflow-hidden rounded-xl border-2 border-[#007bff] bg-zinc-900/90 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 focus-within:border-sky-400 focus-within:shadow-[0_0_0_4px_rgba(0,123,255,0.28),0_0_32px_-8px_rgba(0,123,255,0.35)] sm:flex-row sm:rounded-2xl"
            >
              <label className="sr-only" htmlFor="mix-url">
                YouTube Mix or playlist URL
              </label>
              <input
                ref={urlInputRef}
                id="mix-url"
                className="min-h-14 w-full flex-1 border-0 bg-transparent px-4 py-3.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none sm:px-5 sm:py-4"
                placeholder="https://www.youtube.com/watch?v=...&list=RD..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadPlaylist();
                }}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void loadPlaylist()}
                disabled={busy}
                className="inline-flex min-h-14 shrink-0 cursor-pointer items-center justify-center gap-2 bg-[#007bff] px-6 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-[#0069d9] hover:shadow-[0_0_24px_-4px_rgba(0,123,255,0.6)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px] sm:px-8"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading</span>
                  </>
                ) : (
                  <>
                    <Music2 className="size-5" />
                    <span>Load mix</span>
                  </>
                )}
              </button>
            </div>

            {/* Y2Mate-style result: title + Download / Next */}
            {data && data.tracks.length > 0 ? (
              <div
                ref={resultCardRef}
                className="animate-fade-in-up relative z-10 mx-auto mt-8 max-w-lg rounded-2xl border border-zinc-600 bg-zinc-900 p-6 shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
              >
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Mix ready
                </p>
                <h3 className="mt-3 line-clamp-2 text-center text-lg font-semibold leading-snug text-white sm:text-xl">
                  {data.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-center text-sm text-zinc-400">
                  {data.tracks[0]?.title
                    ? `Starts with · ${data.tracks[0].title}`
                    : `${data.tracks.length} tracks in this queue`}
                </p>
                <p className="mt-1 text-center text-xs text-zinc-500">
                  {data.tracks.length} tracks · one MP3 ZIP · local yt-dlp + ffmpeg
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void downloadZip()}
                    disabled={zipBusy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/50 transition hover:scale-[1.02] hover:bg-red-500 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {zipBusy ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Download className="size-5" />
                    )}
                    Download
                    {zipBusy ? (
                      <span className="tabular-nums text-white/85">
                        ({zipElapsedSec}s)
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("mix-preview")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-zinc-600 bg-black py-3.5 text-sm font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-950"
                  >
                    Next
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </div>
              </div>
            ) : null}

            <p
              id="copyright"
              className="mt-4 flex scroll-mt-[72px] items-start justify-center gap-2 text-center text-sm text-zinc-400"
            >
              <Info
                className="mt-0.5 size-4 shrink-0 text-sky-400"
                aria-hidden
              />
              <span>
                Download only content you have the right to use. Unauthorized
                downloads may violate copyright and YouTube&apos;s Terms of
                Service.
              </span>
            </p>
            <p className="mt-4 text-center text-sm text-zinc-500">
              Batch ZIP download requires{" "}
              <span className="font-medium text-zinc-300">yt-dlp</span> and{" "}
              <span className="font-medium text-zinc-300">ffmpeg</span> on
              this computer.
            </p>
            <p className="mt-2 text-center text-xs text-zinc-500">
              Powered by {brand} — fast Mix preview and one-click audio export.
            </p>
          </div>

          {error ? (
            <div
              ref={errorRef}
              className="mx-auto mt-8 max-w-3xl animate-fade-in rounded-lg border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {/* Main content: playlist + results */}
          <section className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
            <div id="how" className="order-2 scroll-mt-[72px] lg:order-1">
              <h2 className="text-lg font-bold text-white">How it works</h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-xs font-bold text-white shadow-md shadow-blue-500/30">
                    1
                  </span>
                  Copy your YouTube Mix link (the URL must include{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200">
                    list=
                  </code>{" "}
                  for radio playlists).
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-xs font-bold text-white shadow-md shadow-blue-500/30">
                    2
                  </span>
                  Click <strong className="font-semibold text-zinc-200">Load mix</strong>{" "}
                  to fetch titles, channels, and thumbnails.
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-xs font-bold text-white shadow-md shadow-blue-500/30">
                    3
                  </span>
                  Use <strong className="font-semibold text-zinc-200">Download all</strong>{" "}
                  to save every track as MP3 inside one ZIP file.
                </li>
              </ol>
            </div>

            <aside
              id="mix-preview"
              className="order-1 scroll-mt-[72px] lg:sticky lg:top-24 lg:order-2"
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/5 transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_16px_48px_-12px_rgba(0,123,255,0.2)]">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-white">
                      {data?.title ?? "Mix preview"}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-500">
                      {data?.subtitle ??
                        "YouTube radio mixes and playlists with a list ID."}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5 text-zinc-500">
                    <button
                      type="button"
                      onClick={clearPlaylist}
                      className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      aria-label="Clear playlist"
                    >
                      <X className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      aria-label="More options"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[min(70vh,520px)] overflow-y-auto">
                  {!data && !busy ? (
                    <p className="px-4 py-12 text-center text-sm text-zinc-500">
                      Paste a Mix URL and load to see tracks in a familiar
                      playlist layout.
                    </p>
                  ) : null}
                  {busy ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-16 text-sm text-zinc-400">
                      <Loader2
                        className="size-9 animate-spin text-sky-400"
                        aria-hidden
                      />
                      <span>Fetching your mix…</span>
                    </div>
                  ) : null}
                  {data &&
                    data.tracks.map((track, i) => (
                      <button
                        type="button"
                        key={track.id}
                        onClick={() => setActive(i)}
                        className={`flex w-full gap-3 border-b border-zinc-800 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-zinc-800/40 ${
                          active === i
                            ? "bg-blue-950/50"
                            : "bg-zinc-900/30"
                        }`}
                      >
                        <div className="relative flex w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/10">
                          {active === i ? (
                            <Play
                              className="absolute left-1 top-1/2 z-10 size-4 -translate-y-1/2 text-sky-400 drop-shadow-sm"
                              fill="currentColor"
                              aria-hidden
                            />
                          ) : null}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              track.thumbnail ||
                              `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`
                            }
                            alt=""
                            className="aspect-video w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[10px] font-medium leading-none text-white">
                            {track.duration || "—"}
                          </span>
                          {active === i ? (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007bff]" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-100">
                            {track.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {track.channel || "YouTube"}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>

                {data && data.tracks.length > 0 ? (
                  <div className="border-t border-zinc-800 bg-zinc-950/60 p-3">
                    <button
                      type="button"
                      onClick={() => void downloadZip()}
                      disabled={zipBusy}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007bff] py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-blue-500/35 transition-all duration-200 hover:bg-[#0069d9] hover:shadow-[0_0_28px_-6px_rgba(0,123,255,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {zipBusy ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Building ZIP…
                          <span className="tabular-nums text-white/80">
                            ({zipElapsedSec}s)
                          </span>
                        </>
                      ) : (
                        <>
                          <Download className="size-5" />
                          Download all MP3 ({data.tracks.length} tracks)
                        </>
                      )}
                    </button>
                    <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-zinc-500">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
                      The browser waits until every track is converted on your PC
                      (no partial ZIP). Many tracks can take several minutes —
                      keep this tab open. Watch the terminal running{" "}
                      <code className="rounded bg-zinc-800 px-1 text-zinc-400">
                        npm run dev
                      </code>{" "}
                      for yt-dlp progress.
                    </p>
                  </div>
                ) : null}
              </div>
            </aside>
          </section>

          {/* Free Resources */}
          <section
            id="resources"
            className="mt-24 scroll-mt-[72px] border-t border-zinc-800 pt-16"
          >
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-zinc-500">
              Free resources
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "YouTube Mix preview",
                  color: "text-[#007bff]",
                  body: "See every song in your Mix before downloading — titles, channels, artwork, and length at a glance.",
                  icon: Headphones,
                },
                {
                  title: "Batch MP3 export",
                  color: "text-red-400",
                  body: "Pack the whole queue into a single ZIP of MP3s instead of downloading clips one by one.",
                  icon: Download,
                },
                {
                  title: "Works locally",
                  color: "text-emerald-400",
                  body: "Runs on your machine with yt-dlp and ffmpeg so you control quality and storage.",
                  icon: CloudDownload,
                },
              ].map((card, i) => (
                <article
                  key={card.title}
                  className="animate-fade-in-up flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg shadow-black/40 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-xl hover:shadow-blue-500/15"
                  style={{
                    animationDelay: `${150 + i * 120}ms`,
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-800 text-[#007bff] ring-1 ring-zinc-700">
                      <card.icon className="size-5" aria-hidden />
                    </span>
                    <YoutubeGlyph className="size-5 text-red-500 opacity-90" />
                    <ArrowRight className="size-4 text-zinc-600" aria-hidden />
                    <FileAudio className="size-5 text-sky-400" aria-hidden />
                  </div>
                  <h3
                    className={`text-lg font-bold ${card.color} transition-colors`}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="relative border-t border-zinc-800 bg-zinc-950/90 py-10 text-center text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} {brand}. For personal, lawful use only.
          </p>
        </footer>
      </div>
    </div>
  );
}
