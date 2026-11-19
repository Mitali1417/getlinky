function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function stripSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

function getFrontendUrl() {
  const url = isProduction()
    ? process.env.PRODUCTION_FRONTEND_URL
    : process.env.LOCAL_FRONTEND_URL;
  return stripSlash(url);
}

function getBaseUrl() {
  const url = isProduction()
    ? process.env.PRODUCTION_BASE_URL
    : process.env.LOCAL_BASE_URL;
  return stripSlash(url);
}

function getCookieOptions() {
  const frontend = getFrontendUrl();
  const base = getBaseUrl();
  let crossSite = false;
  try {
    crossSite = new URL(frontend).origin !== new URL(base).origin;
  } catch {
    crossSite = false;
  }

  const secure =
    isProduction() ||
    frontend.startsWith("https") ||
    base.startsWith("https") ||
    crossSite;

  return {
    httpOnly: true,
    path: "/",
    secure,
    sameSite: crossSite ? "none" : "lax",
  };
}

module.exports = {
  isProduction,
  getFrontendUrl,
  getBaseUrl,
  getCookieOptions,
};
module.exports.default = module.exports;
