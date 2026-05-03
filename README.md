# MixGrab

Preview YouTube Mix / playlist URLs and batch-download audio as a single MP3 ZIP using **local [yt-dlp](https://github.com/yt-dlp/yt-dlp)** and **ffmpeg** (no third-party download API).

## Prerequisites

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) and **ffmpeg** on your PATH (Windows: `winget install yt-dlp.yt-dlp`, `winget install Gyan.FFmpeg`)

Optional: put full paths in `.env.local`:

- `YT_DLP_PATH` — path to `yt-dlp.exe`
- `FFMPEG_PATH` — path to `ffmpeg.exe`

(`npm run dev` must be restarted after changing PATH or `.env.local`.)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Learn more

This app is built with [Next.js](https://nextjs.org). See the [Next.js documentation](https://nextjs.org/docs).

## License

BSD-2-Clause — see [LICENSE](./LICENSE) if present in the repository.
