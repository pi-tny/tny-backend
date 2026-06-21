// Vercel serverless entry. Kept as plain JS (not .ts) so we can register the
// tsx runtime hook BEFORE the TypeScript app is loaded. Vercel's bundler
// transpiles .ts files per-file and does NOT resolve the "@/*" path aliases,
// so instead we run the real source through tsx, which reads tsconfig.json and
// resolves the aliases at runtime — same approach as the Docker image. The
// source tree (src, generated, docs) is shipped via includeFiles in vercel.json.
require("tsx/cjs");

const { app } = require("../src/app");

module.exports = async (req, res) => {
  await app.ready();
  app.server.emit("request", req, res);
};
