export function isHttpUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function hostnameLetter(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return (host[0] || "?").toUpperCase();
  } catch {
    return "!";
  }
}

export function displayShortUrl(url) {
  if (!url) return "";
  return String(url).replace(/^https?:\/\//, "");
}

export function formatRelativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const mins = Math.max(1, Math.floor(diffMs / minute));
    return `${mins}m ago`;
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours}h ago`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function qrImageSrc(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
}
