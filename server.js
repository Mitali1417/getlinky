require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");

let load = require("./utils/cjs");
if (typeof load !== "function") load = load.default;

const UrlRoute = load(require("./routes/url"));
const staticRoute = load(require("./routes/staticRouter"));
const UserRoute = load(require("./routes/user"));
const auth = load(require("./middlewares/auth"));
const { restrictToLoggedInUserOnly, checkAuth } = auth;

const app = express();
const PORT = process.env.PORT || 5005;

app.use(express.static(path.join(__dirname, "public")));
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
    res.status(500).send("Database unavailable");
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/url", restrictToLoggedInUserOnly, UrlRoute);
app.use("/user", UserRoute);
app.use("/", checkAuth, staticRoute);

if (!process.env.VERCEL) {
  connectMongo()
    .then(() => {
      console.log("MongoDB Connected");
      app.listen(PORT, () => {
        console.log(`Server is listening at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.log(error, "Error Occured");
    });
}

module.exports = app;
module.exports.default = app;
