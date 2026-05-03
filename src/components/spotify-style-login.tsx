"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Apple, ArrowLeft, Eye, EyeOff, Infinity as InfinityIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useState } from "react";

import { FacebookGlyph, GoogleGlyph } from "@/components/spotify-auth-icons";

const brand = "MixGrab";
const spotifyGreen = "#1DB954";

export function SpotifyStyleLogin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const onSocial = useCallback((name: string) => {
    setNotice(`${name} sign-in is not enabled in this demo.`);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setNotice(null);
      router.push("/");
    },
    [router],
  );

  return (
    <div className="relative flex min-h-full flex-col bg-[#121212] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(29, 185, 84, 0.12), transparent 50%)",
        }}
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/10 bg-[#121212]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-white transition hover:text-white/90"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#007bff] text-white shadow-lg shadow-blue-600/30 transition group-hover:scale-105">
              <InfinityIcon className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">{brand}</span>
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="auth-card-animate w-full max-w-[28rem] space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Log in to continue
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Demo UI — accounts are not connected. Use the form or go home to
              use the Mix downloader.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onSocial("Facebook")}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-500 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5 active:scale-[0.99]"
            >
              <FacebookGlyph className="size-5 text-[#1877F2]" />
              Continue with Facebook
            </button>
            <button
              type="button"
              onClick={() => onSocial("Apple")}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-500 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5 active:scale-[0.99]"
            >
              <Apple className="size-5" aria-hidden />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => onSocial("Google")}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-500 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5 active:scale-[0.99]"
            >
              <GoogleGlyph className="size-5" />
              Continue with Google
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="grow border-t border-neutral-600" />
            <span className="px-4 text-xs font-medium uppercase tracking-wider text-neutral-500">
              or
            </span>
            <div className="grow border-t border-neutral-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-white"
              >
                Email or username
              </label>
              <input
                id="auth-email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="Email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-[#121212] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-600 bg-[#121212] py-3 pl-3.5 pr-11 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-neutral-500 bg-[#121212] text-[#1DB954] focus:ring-[#1DB954] focus:ring-offset-0"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() =>
                  setNotice("Password reset is not available in this demo.")
                }
                className="text-sm font-medium text-white underline underline-offset-4 transition hover:text-[#1DB954]"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-full py-3.5 text-base font-bold text-black transition hover:scale-[1.01] hover:brightness-110 active:scale-[0.99]"
              style={{ backgroundColor: spotifyGreen }}
            >
              Log In
            </button>
          </form>

          {notice ? (
            <p
              className="animate-fade-in rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-neutral-300"
              role="status"
            >
              {notice}
            </p>
          ) : null}

          <p className="text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-white underline underline-offset-4 transition hover:text-[#1DB954]"
            >
              Sign up for MixGrab
            </Link>
          </p>

          <p className="text-center text-xs text-neutral-600">
            Demo experience · No data is stored on our servers
          </p>
        </div>
      </main>
    </div>
  );
}
