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

## Hosting (Netlify, Vercel, etc.)

**Playlist loading and ZIP downloads will not work** on typical serverless hosts: they do not include `yt-dlp` or `ffmpeg`, and this app shells out to those binaries.

You can still deploy the site for a **demo UI** (with an on-page notice). For full functionality, run the app **locally** or on a **VPS / Docker** image where you install `yt-dlp` and `ffmpeg`.

This repo includes [`netlify.toml`](./netlify.toml) and [`@netlify/plugin-nextjs`](https://github.com/netlify/netlify-plugin-nextjs) for Netlify builds.

## Learn more

This app is built with [Next.js](https://nextjs.org). See the [Next.js documentation](https://nextjs.org/docs).

## License

BSD-2-Clause — see [LICENSE](./LICENSE) if present in the repository.
