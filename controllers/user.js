let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const USER = load(require("../models/user"));
const { setUser } = load(require("../utils/auth"));
const { getCookieOptions } = load(require("../utils/config"));

const handleSignup = async (req, res) => {
  const body = req.body;
  if (!body?.name || !body?.email || !body?.password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const existingUser = await USER.findOne({ email: body.email });
  if (existingUser) {
    return res.status(409).json({ error: "Email already in use" });
  }

  await USER.create({
    name: body.name,
    email: body.email,
    password: body.password,
  });
  return res.status(201).json({ ok: true });
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await USER.findOne({ email, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = setUser(user);
  res.cookie("uid", token, getCookieOptions());
  return res.json({
    ok: true,
    user: { _id: user._id, name: user.name, email: user.email },
  });
};

const handleLogout = async (req, res) => {
  res.clearCookie("uid", getCookieOptions());
  return res.json({ ok: true });
};

const handleMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({
    user: { _id: req.user._id, email: req.user.email },
  });
};

module.exports = { handleSignup, handleLogin, handleLogout, handleMe };
module.exports.default = module.exports;
