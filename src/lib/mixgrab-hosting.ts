/**
 * MixGrab runs yt-dlp + ffmpeg as child processes. Typical serverless hosts
 * (Netlify, Vercel, AWS Lambda) do not ship those binaries and cannot run this app fully.
 */

function envFlag(...vals: (string | undefined)[]): boolean {
  return vals.some((v) => {
    if (v == null || v === "") return false;
    const s = v.toLowerCase();
    return s === "true" || s === "1";
  });
}

export function isServerlessHosting(): boolean {
  return (
    envFlag(process.env.NETLIFY) ||
    envFlag(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.AWS_EXECUTION_ENV)
  );
}

/** User-facing help when yt-dlp is missing or unusable. */
export function getYtDlpInstallHelpText(): string {
  if (isServerlessHosting()) {
    return [
      "You deployed MixGrab to a serverless host (e.g. Netlify or Vercel). Those platforms do not include yt-dlp or ffmpeg, so playlist resolution and ZIP downloads cannot work in the cloud.",
      "Use MixGrab on your own computer: clone the repo, install yt-dlp and ffmpeg, run `npm install` and `npm run dev`.",
      "To share it online you need a server where you can install those tools (VPS, Docker, Railway/Fly with a custom image, etc.) — not plain Netlify Functions.",
    ].join("\n");
  }

  return [
    "Install yt-dlp on this machine, then restart your terminal and `npm run dev`:",
    "• Windows: winget install yt-dlp",
    "• Or: pip install -U yt-dlp (add Python Scripts to PATH, or set YT_DLP_PATH to the .exe)",
    "• If it is already installed, set YT_DLP_PATH in .env.local to the full path of yt-dlp.exe",
  ].join("\n");
}

/** User-facing help when ffmpeg is missing (download-zip). */
export function getFfmpegInstallHelpText(): string {
  if (isServerlessHosting()) {
    return [
      "ZIP downloads require ffmpeg on the server. Netlify and similar hosts do not provide ffmpeg for serverless functions.",
      "Run MixGrab locally with ffmpeg installed, or deploy to a VPS/Docker environment where you can install ffmpeg.",
    ].join("\n");
  }

  return [
    "Install ffmpeg (e.g. winget install Gyan.FFmpeg), restart the terminal, then `npm run dev`.",
    "Or set FFMPEG_PATH in .env.local to the full path of ffmpeg.exe",
  ].join("\n");
}
