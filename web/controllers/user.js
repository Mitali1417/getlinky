let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const USER = load(require("../models/user"));
const { setUser } = load(require("../utils/auth"));
const { getCookieOptions } = load(require("../utils/config"));

const handleSignup = async (req, res) => {
  try {
    const body = req.body;
    if (!body?.name || !body?.email || !body?.password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
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
  } catch (error) {
    console.error("[signup]", error);
    return res.status(500).json({ error: "Could not create account" });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

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
  } catch (error) {
    console.error("[login]", error);
    return res.status(500).json({ error: "Could not log in" });
  }
};

const handleLogout = async (req, res) => {
  try {
    res.clearCookie("uid", getCookieOptions());
    return res.json({ ok: true });
  } catch (error) {
    console.error("[logout]", error);
    return res.status(500).json({ error: "Could not log out" });
  }
};

const handleMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const dbUser = await USER.findById(req.user._id).select("name email");
    if (!dbUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({
      user: { _id: dbUser._id, name: dbUser.name, email: dbUser.email },
    });
  } catch (error) {
    console.error("[me]", error);
    return res.status(500).json({ error: "Could not load user" });
  }
};

module.exports = { handleSignup, handleLogin, handleLogout, handleMe };
module.exports.default = module.exports;
