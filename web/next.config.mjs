import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadRootEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadRootEnv();

const isProduction =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

function stripSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

const frontendUrl = stripSlash(
  (isProduction
    ? process.env.PRODUCTION_FRONTEND_URL
    : process.env.LOCAL_FRONTEND_URL) 
);

const apiUrl = stripSlash(
  (isProduction
    ? process.env.PRODUCTION_BASE_URL
    : process.env.LOCAL_BASE_URL) 
);

let sameOrigin = false;
try {
  sameOrigin = new URL(frontendUrl).origin === new URL(apiUrl).origin;
} catch {
  sameOrigin = false;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_BASE_URL: apiUrl,
    NEXT_PUBLIC_FRONTEND_URL: frontendUrl,
    NEXT_PUBLIC_API_URL:
      !sameOrigin && isProduction ? apiUrl : "",
  },
  async rewrites() {
    if (sameOrigin) return [];
    return [
      { source: "/user", destination: `${apiUrl}/user` },
      { source: "/user/:path*", destination: `${apiUrl}/user/:path*` },
      { source: "/url", destination: `${apiUrl}/url` },
      { source: "/url/:path*", destination: `${apiUrl}/url/:path*` },
    ];
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
