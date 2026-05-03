import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

import { getYtDlpInstallHelpText } from "./mixgrab-hosting";

const execFileAsync = promisify(execFile);

function isEnoent(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/** Ordered list of executables to try (Windows often needs yt-dlp.exe or a full path). */
export function getYtDlpCandidates(): string[] {
  const c: string[] = [];
  const env = process.env.YT_DLP_PATH?.trim();
  if (env) c.push(env);

  c.push("yt-dlp", "yt-dlp.exe");

  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    if (local) {
      c.push(join(local, "Programs", "yt-dlp", "yt-dlp.exe"));
      c.push(join(local, "Microsoft", "WinGet", "Links", "yt-dlp.exe"));
      for (const py of ["Python313", "Python312", "Python311", "Python310"]) {
        c.push(join(local, "Programs", "Python", py, "Scripts", "yt-dlp.exe"));
      }
    }
    const pf = process.env.ProgramFiles;
    if (pf) {
      c.push(join(pf, "yt-dlp", "yt-dlp.exe"));
    }
    const appData = process.env.APPDATA;
    if (appData) {
      c.push(
        join(
          appData,
          "Python",
          "Python311",
          "Scripts",
          "yt-dlp.exe",
        ),
      );
      c.push(join(appData, "Python", "Python312", "Scripts", "yt-dlp.exe"));
      c.push(join(appData, "Python", "Python313", "Scripts", "yt-dlp.exe"));
    }
  }

  return [...new Set(c.filter(Boolean))];
}

export function formatYtDlpInstallHelp(): string {
  return getYtDlpInstallHelpText();
}

/** Run yt-dlp with argv; tries each candidate until one runs (not ENOENT). */
export async function execYtDlp(
  args: string[],
  options: { maxBuffer?: number } = {},
): Promise<{ stdout: string; bin: string }> {
  const candidates = getYtDlpCandidates();
  let lastEnoent = false;

  for (const bin of candidates) {
    if (bin.includes("\\") || bin.includes("/")) {
      if (!existsSync(bin)) continue;
    }
    try {
      const { stdout } = await execFileAsync(bin, args, {
        maxBuffer: options.maxBuffer ?? 50 * 1024 * 1024,
        windowsHide: true,
      });
      return { stdout: stdout.toString(), bin };
    } catch (err) {
      if (isEnoent(err)) {
        lastEnoent = true;
        continue;
      }
      throw err;
    }
  }

  if (lastEnoent) {
    throw new Error(
      `yt-dlp was not found (ENOENT). Tried: ${candidates.join(", ")}\n\n${formatYtDlpInstallHelp()}`,
    );
  }
  throw new Error(`Could not run yt-dlp.\n\n${formatYtDlpInstallHelp()}`);
}

/** Spawn yt-dlp for long jobs (download). Uses first binary that exists. */
export function spawnYtDlp(
  args: string[],
  options: {
    onStdout?: (chunk: string) => void;
    /** Forward yt-dlp stderr to server console (progress / errors). */
    logStderrToConsole?: boolean;
  } = {},
): Promise<void> {
  const candidates = getYtDlpCandidates();

  const tryBin = (index: number): Promise<void> => {
    if (index >= candidates.length) {
      return Promise.reject(
        new Error(
          `yt-dlp not found. Tried: ${candidates.join(", ")}\n\n${formatYtDlpInstallHelp()}`,
        ),
      );
    }

    const bin = candidates[index];
    if ((bin.includes("\\") || bin.includes("/")) && !existsSync(bin)) {
      return tryBin(index + 1);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        windowsHide: true,
        /** Avoid stdin pipe edge cases; keep stdout/stderr piped so we can drain them. */
        stdio: ["ignore", "pipe", "pipe"],
      });
      /** Captured for failure messages only; cap size — progress mode can be verbose. */
      let stderr = "";
      const STDERR_CAP = 200_000;
      let settled = false;

      child.stderr?.on("data", (chunk: Buffer) => {
        const s = chunk.toString();
        stderr = (stderr + s).slice(-STDERR_CAP);
        if (options.logStderrToConsole) {
          process.stderr.write(chunk);
        }
      });
      /** Always drain stdout — unfilled pipe buffers can stall yt-dlp on Windows. */
      child.stdout?.on("data", (chunk: Buffer) => {
        options.onStdout?.(chunk.toString());
      });

      child.on("error", (err) => {
        if (settled) return;
        if (isEnoent(err)) {
          settled = true;
          void tryBin(index + 1).then(resolve, reject);
          return;
        }
        settled = true;
        reject(err);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        if (code === 0) {
          resolve();
          return;
        }
        reject(
          new Error(
            stderr.trim() ||
              `yt-dlp exited with code ${code}. Is ffmpeg installed and on PATH?`,
          ),
        );
      });
    });
  };

  return tryBin(0);
}
