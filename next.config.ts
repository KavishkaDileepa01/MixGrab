import type { NextConfig } from "next";

function deployFlag(v: string | undefined): boolean {
  if (v == null || v === "") return false;
  const s = v.toLowerCase();
  return s === "true" || s === "1";
}

const serverlessDeploy =
  deployFlag(process.env.NETLIFY) || deployFlag(process.env.VERCEL);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_MIXGRAB_SERVERLESS: serverlessDeploy ? "1" : "",
  },
};

export default nextConfig;
