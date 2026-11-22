/**
 * Vercel's bundler wraps CJS `module.exports` as `{ default: ... }`.
 * Named destructuring then becomes undefined (Express: Route.get() got Undefined).
 */
function load(mod) {
  if (mod == null) return mod;

  const def = mod.default;
  if (def === undefined) return mod;

  if (typeof def === "function") {
    return Object.assign(def, mod);
  }

  if (def && typeof def === "object") {
    return Object.assign({}, def, mod);
  }

  return def;
}

module.exports = load;
module.exports.load = load;
module.exports.default = load;
