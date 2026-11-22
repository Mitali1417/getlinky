const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

let load = require("./utils/cjs");
if (typeof load !== "function") load = load.default;

const UrlRoute = load(require("./routes/url"));
const UserRoute = load(require("./routes/user"));
const auth = load(require("./middlewares/auth"));
const { getFrontendUrl, getBaseUrl, isProduction } = load(
  require("./utils/config")
);
const { restrictToLoggedInUserOnly } = auth;

const app = express();
const PORT = process.env.PORT || 5005;
const frontendOrigin = getFrontendUrl();

if (isProduction()) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function connectMongo() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }
  await mongoose.connect(mongoUri);
}

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    console.error(error, "Error Occured");
    res.status(500).json({ error: "Database unavailable" });
  }
});

app.use("/url", restrictToLoggedInUserOnly, UrlRoute);
app.use("/user", UserRoute);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

if (process.env.VERCEL !== "1") {
  const server = app.listen(PORT, "0.0.0.0", () => {
    const mode = isProduction() ? "production" : "local";
    console.log(`Server is listening at http://127.0.0.1:${PORT} (${mode})`);
    console.log(`Frontend: ${frontendOrigin}`);
    console.log(`Public short-link host: ${getBaseUrl()}`);
  });

  server.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  connectMongo()
    .then(() => {
      console.log("MongoDB Connected");
    })
    .catch((error) => {
      console.log(error, "Error Occured");
    });
}

module.exports = app;
module.exports.default = app;
