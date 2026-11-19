const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

export function publicShortUrl(shortId, fallback) {
  if (fallback) return fallback;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (base) return `${base.replace(/\/$/, "")}/url/${shortId}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/url/${shortId}`;
  }
  return `/url/${shortId}`;
}

export async function api(path, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_ORIGIN}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    ...rest,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.msg || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
}
