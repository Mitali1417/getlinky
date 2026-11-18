const { Buffer } = require("buffer");
globalThis.Buffer = globalThis.Buffer || Buffer;

const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY;

const setUser = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    secretKey
  );
};

const getUser = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
};

module.exports = { setUser, getUser };
module.exports.default = module.exports;
