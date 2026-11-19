let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const { getUser } = load(require("../utils/auth"));
const { getFrontendUrl } = load(require("../utils/config"));

function sendUnauthorized(req, res) {
  const path = (req.originalUrl || "").split("?")[0];
  if (req.method === "GET" && /^\/url\/[^/]+$/.test(path)) {
    return res.redirect(`${getFrontendUrl()}/login`);
  }
  return res.status(401).json({ error: "Unauthorized" });
}

const restrictToLoggedInUserOnly = async (req, res, next) => {
  const userId = req.cookies?.uid;
  if (!userId) {
    return sendUnauthorized(req, res);
  }
  const user = getUser(userId);
  if (!user) {
    return sendUnauthorized(req, res);
  }
  req.user = user;
  next();
};

const checkAuth = (req, res, next) => {
  const userId = req.cookies?.uid;
  const user = getUser(userId);
  req.user = user;
  next();
};

module.exports = { restrictToLoggedInUserOnly, checkAuth };
module.exports.default = module.exports;
