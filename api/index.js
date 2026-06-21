// Vercel serverless entry. Vercel's @vercel/node transpiles .ts files per-file
// and does NOT resolve the "@/*" path aliases, so we don't let it touch the
// source. Instead `npm run build:vercel` (see vercel.json) pre-bundles the
// Fastify app into dist/app.cjs with esbuild — aliases resolved at build time,
// node_modules kept external (so packages like @fastify/swagger-ui still find
// their own assets via __dirname). Here we just hand requests to that app.
const { app } = require("../dist/app.cjs");

module.exports = async (req, res) => {
  await app.ready();
  app.server.emit("request", req, res);
};
