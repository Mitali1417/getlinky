const express = require("express");

let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const { restrictToLoggedInUserOnly } = load(require("../middlewares/auth"));
const { handleGenerateURL, handleGetURL } = load(require("../controllers/url"));

const router = express.Router();

router.post("/", restrictToLoggedInUserOnly, handleGenerateURL);

router.get("/:shortId", handleGetURL);

module.exports = router;
module.exports.default = router;
