import Link from "next/link";
import {
  ArrowLeft,
  CloudDownload,
  Infinity as InfinityIcon,
  Music2,
  Sparkles,
} from "lucide-react";

const brand = "MixGrab";

type AuthPageShellProps = {
  title: string;
  description: string;
  variant?: "login" | "signup";
};

export function AuthPageShell({
  title,
  description,
  variant = "login",
}: AuthPageShellProps) {
  const isSignup = variant === "signup";

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-white">
      {/* Animated ambient blobs */}
      <div
        className="pointer-events-none absolute -left-24 top-32 size-[420px] rounded-full bg-[#007bff]/15 blur-[80px] auth-blob-1"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-20 size-[380px] rounded-full bg-sky-400/20 blur-[72px] auth-blob-2"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-40 size-[280px] -translate-x-1/2 rounded-full bg-violet-400/10 blur-[64px]"
        aria-hidden
      />

      <div className="bg-grid-subtle relative flex min-h-full flex-1 flex-col">
        {/* Mini header — links use real navigation */}
        <header className="relative z-10 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="group flex items-center gap-2 text-neutral-900 transition hover:text-[#007bff]"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#007bff] text-white shadow-md shadow-blue-500/25 transition group-hover:scale-105">
                <InfinityIcon className="size-5" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-lg font-semibold tracking-tight">{brand}</span>
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-[#007bff]"
            >
              <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
              Home
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
          {/* Floating icon strip */}
          <div className="animate-fade-in-up animate-delay-100 mb-8 flex items-center justify-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:scale-105 hover:shadow-xl">
              <Music2 className="size-6" aria-hidden />
            </span>
            <Sparkles className="size-5 text-amber-400" aria-hidden />
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#007bff] text-white shadow-lg shadow-blue-500/35 transition hover:scale-105 hover:shadow-xl">
              <CloudDownload className="size-6" aria-hidden />
            </span>
          </div>

          <div className="auth-card-animate w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-[0_24px_64px_-16px_rgba(0,123,255,0.18)] ring-1 ring-black/[0.04]">
              <div
                className="auth-shimmer-bar absolute left-0 right-0 top-0 h-1 rounded-t-2xl opacity-90"
                aria-hidden
              />
              <div className="relative space-y-5 pt-1 text-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#007bff]">
                    {isSignup ? "Join" : "Welcome back"}
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                    {title}
                  </h1>
                </div>
                <p className="text-pretty text-sm leading-relaxed text-neutral-600 sm:text-base">
                  {description}
                </p>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
                  {isSignup ? (
                    <Link
                      href="/"
                      className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-[#007bff] bg-white px-6 text-sm font-bold uppercase tracking-wide text-[#007bff] shadow-sm transition-all duration-300 hover:border-[#0069d9] hover:bg-blue-50 hover:shadow-md active:scale-[0.98] sm:w-auto"
                    >
                      <span className="relative z-10">Back to home</span>
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[#007bff] px-6 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:bg-[#0069d9] hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] sm:w-auto"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition duration-500 group-hover:translate-x-full group-hover:opacity-100" />
                      <span className="relative z-10">Back to home</span>
                    </Link>
                  )}
                  <Link
                    href={isSignup ? "/login" : "/signup"}
                    className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold transition sm:w-auto ${
                      isSignup
                        ? "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-white"
                        : "text-[#007bff] underline-offset-4 hover:underline"
                    }`}
                  >
                    {isSignup ? "Log in instead" : "Create an account"}
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-neutral-400">
              Demo experience · No data is stored on our servers
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
