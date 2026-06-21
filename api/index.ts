import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "@/app";

// Vercel serverless entry. Fastify never calls `listen` here; we await the
// instance and hand the raw req/res to its underlying http server. All routes
// are funneled here by the rewrite in vercel.json.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await app.ready();
  app.server.emit("request", req, res);
}
