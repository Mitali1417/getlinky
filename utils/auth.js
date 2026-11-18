const crypto = require("crypto");

const secretKey = process.env.JWT_SECRET_KEY;

function toBase64Url(value) {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(data) {
  return toBase64Url(crypto.createHmac("sha256", secretKey).update(data).digest());
}

const setUser = (user) => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      _id: user._id,
      email: user.email,
    })
  );
  const data = `${header}.${payload}`;
  return `${data}.${sign(data)}`;
};

const getUser = (token) => {
  if (!token || !secretKey) return null;
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = sign(data);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(actualBuf, expectedBuf)) return null;

  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return json;
  } catch (err) {
    return null;
  }
};

module.exports = { setUser, getUser };
module.exports.default = module.exports;
