const { Buffer } = require("buffer");
globalThis.Buffer = globalThis.Buffer || Buffer;

let app = require("../server");
if (app && typeof app !== "function" && app.default) {
  app = app.default;
}

module.exports = app;
