const express = require("express");
const router = express.Router();

let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const { handleSignup, handleLogin, handleLogout } = load(
  require("../controllers/user")
);

router.post("/", handleSignup);

router.post("/logout", handleLogout);

router.post("/login", handleLogin);

module.exports = router;
module.exports.default = router;
