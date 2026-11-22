import { logError } from "@/lib/logger";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";
const API_DOWN =
  "Cannot reach the API. Restart with npm run dev and wait for port 5005.";

export function publicShortUrl(shortId, fallback) {
  if (fallback) return fallback;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (base) return `${base.replace(/\/$/, "")}/url/${shortId}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/url/${shortId}`;
  }
  return `/url/${shortId}`;
}

function makeError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }
  const text = await res.text().catch(() => "");
  return { error: text };
}

export async function api(path, options = {}) {
  const { headers, ...rest } = options;
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      ...rest,
    });

    const data = await readBody(res);
    if (!res.ok) {
      const raw = data.error || data.msg || "";
      const isProxyFailure =
        res.status >= 500 &&
        (!raw ||
          raw === "Request failed" ||
          /ECONNREFUSED|Failed to proxy|Internal Server Error/i.test(raw));
      throw makeError(
        isProxyFailure ? API_DOWN : raw || "Request failed",
        res.status
      );
    }
    return data;
  } catch (error) {
    const wrapped =
      error?.status === undefined &&
      (error instanceof TypeError || error?.message === "Failed to fetch")
        ? makeError(API_DOWN, 0)
        : error;
    logError(`api ${rest.method || "GET"} ${path}`, wrapped);
    throw wrapped;
  }
}
