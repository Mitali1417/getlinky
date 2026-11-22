let app = require("../server");
if (app && typeof app !== "function" && app.default) {
  app = app.default;
}

module.exports = app;
