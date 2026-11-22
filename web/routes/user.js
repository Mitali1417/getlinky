const express = require("express");
const router = express.Router();

let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const { handleSignup, handleLogin, handleLogout, handleMe } = load(
  require("../controllers/user")
);
const { restrictToLoggedInUserOnly } = load(require("../middlewares/auth"));

router.post("/", handleSignup);

router.post("/logout", handleLogout);

router.post("/login", handleLogin);

router.get("/me", restrictToLoggedInUserOnly, handleMe);

module.exports = router;
module.exports.default = router;
