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

function productionUrl() {
  return stripSlash(
    process.env.PRODUCTION_URL ||
      process.env.PRODUCTION_FRONTEND_URL ||
      process.env.PRODUCTION_BASE_URL ||
      process.env.API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  );
}

const frontendUrl = stripSlash(
  isProduction
    ? productionUrl()
    : process.env.LOCAL_FRONTEND_URL || "http://localhost:3000"
);

const apiUrl = stripSlash(
  isProduction
    ? productionUrl()
    : (process.env.LOCAL_BASE_URL || "http://localhost:5005").replace(
        "localhost",
        "127.0.0.1"
      )
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_BASE_URL: frontendUrl || apiUrl,
    NEXT_PUBLIC_FRONTEND_URL: frontendUrl,
    NEXT_PUBLIC_API_URL: "",
  },
  async rewrites() {
    if (isProduction) return [];
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
