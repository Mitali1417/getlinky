function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function stripSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

function vercelUrl() {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
}

function getProductionUrl() {
  return stripSlash(
    process.env.PRODUCTION_URL ||
      process.env.PRODUCTION_FRONTEND_URL ||
      process.env.PRODUCTION_BASE_URL ||
      process.env.API_URL ||
      vercelUrl()
  );
}

function getFrontendUrl() {
  if (isProduction()) {
    return getProductionUrl();
  }
  return stripSlash(process.env.LOCAL_FRONTEND_URL || "http://localhost:3000");
}

function getBaseUrl() {
  if (isProduction()) {
    return getProductionUrl();
  }
  return stripSlash(process.env.LOCAL_BASE_URL || "http://localhost:5005");
}

function getCookieOptions() {
  const frontend = getFrontendUrl();
  const base = getBaseUrl();
  let crossSite = false;
  try {
    crossSite =
      frontend && base && new URL(frontend).origin !== new URL(base).origin;
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
  getProductionUrl,
  getFrontendUrl,
  getBaseUrl,
  getCookieOptions,
};
module.exports.default = module.exports;
