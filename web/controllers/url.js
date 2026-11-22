let load = require("../utils/cjs");
if (typeof load !== "function") load = load.default;

const shortid = load(require("shortid"));
const URL = load(require("../models/url"));
const { getBaseUrl } = load(require("../utils/config"));

function toPublicUrl(shortId) {
  return `${getBaseUrl()}/url/${shortId}`;
}

const handleGenerateURL = async (req, res) => {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "URL required" });
  const shortId = shortid();
  try {
    await URL.create({
      shortId: shortId,
      redirectURL: body.url,
      visitHistory: [],
      createdBy: req.user._id,
    }); 
    return res.status(201).json({
      id: shortId,
      shortUrl: toPublicUrl(shortId),
    });
  } catch (error) {
    console.error("[generate-url]", error);
    return res.status(500).json({ error: "Error creating short URL" });
  }
};

const handleListURLs = async (req, res) => {
  try {
    const urls = await URL.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json({
      urls: urls.map((url) => ({
        shortId: url.shortId,
        redirectURL: url.redirectURL,
        shortUrl: toPublicUrl(url.shortId),
        clicks: url.visitHistory?.length || 0,
        createdAt: url.createdAt,
      })),
    });
  } catch (error) {
    console.error("[list-urls]", error);
    return res.status(500).json({ error: "Error fetching URLs" });
  }
};

const handleGetURL = async (req, res) => {
  const shortId = req.params.shortId;

  try {
    const entry = await URL.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      },
      { new: true }
    );

    if (entry) {
      res.redirect(entry.redirectURL);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (error) {
    console.error("[redirect-url]", error);
    res.status(500).send("Error fetching the URL");
  }
};

const handleDeleteURL = async (req, res) => {
  const shortId = req.params.shortId;
  try {
    const deleted = await URL.findOneAndDelete({
      shortId,
      createdBy: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ error: "URL not found" });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("[delete-url]", error);
    return res.status(500).json({ error: "Error deleting URL" });
  }
};

module.exports = {
  handleGenerateURL,
  handleGetURL,
  handleListURLs,
  handleDeleteURL,
};
module.exports.default = module.exports;
