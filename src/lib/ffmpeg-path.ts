import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Walk shallow trees under WinGet FFmpeg packages to find ffmpeg.exe */
function findFfmpegExe(startDir: string, depth: number): string | undefined {
  if (depth <= 0) return undefined;
  try {
    const entries = readdirSync(startDir, { withFileTypes: true });
    for (const e of entries) {
      const p = join(startDir, e.name);
      if (e.isFile() && e.name.toLowerCase() === "ffmpeg.exe") return p;
      if (e.isDirectory()) {
        const inner = findFfmpegExe(p, depth - 1);
        if (inner) return inner;
      }
    }
  } catch {
    /* ignore permission / race */
  }
  return undefined;
}

/**
 * Resolve ffmpeg binary for yt-dlp (`--ffmpeg-location`).
 * Does not rely on PATH alone so Next.js keeps working after WinGet installs ffmpeg.
 */
export function getFfmpegBinaryPath(): string | undefined {
  const env = process.env.FFMPEG_PATH?.trim();
  if (env && existsSync(env)) return env;

  if (process.platform === "win32") {
    try {
      const out = execFileSync("where.exe", ["ffmpeg"], {
        encoding: "utf8",
        windowsHide: true,
      });
      const line = out.trim().split(/\r?\n/)[0]?.trim();
      if (line && existsSync(line)) return line;
    } catch {
      /* not on PATH */
    }

    const local = process.env.LOCALAPPDATA;
    if (local) {
      const pkgRoot = join(local, "Microsoft", "WinGet", "Packages");
      if (existsSync(pkgRoot)) {
        try {
          const entries = readdirSync(pkgRoot).filter((name) =>
            /ffmpeg/i.test(name),
          );
          entries.sort((a, b) => {
            const rank = (n: string) =>
              n.startsWith("Gyan.FFmpeg")
                ? 0
                : n.startsWith("yt-dlp.FFmpeg")
                  ? 1
                  : 2;
            const d = rank(a) - rank(b);
            return d !== 0 ? d : a.localeCompare(b);
          });
          for (const name of entries) {
            const found = findFfmpegExe(join(pkgRoot, name), 10);
            if (found) return found;
          }
        } catch {
          /* ignore */
        }
      }
    }

    const pf = process.env["ProgramFiles"];
    if (pf) {
      const candidate = join(pf, "ffmpeg", "bin", "ffmpeg.exe");
      if (existsSync(candidate)) return candidate;
    }
  } else {
    try {
      const out = execFileSync("which", ["ffmpeg"], {
        encoding: "utf8",
      });
      const line = out.trim().split(/\n/)[0]?.trim();
      if (line && existsSync(line)) return line;
    } catch {
      /* ignore */
    }
  }

  return undefined;
}
