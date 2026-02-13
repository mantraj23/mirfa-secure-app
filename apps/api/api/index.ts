import serverless from "serverless-http";
import { buildServer } from "../src/server.js";

let server: any;

async function getServer() {
  if (!server) {
    const app = await buildServer();
    server = serverless(app.server);
  }
  return server;
}

export default async function handler(req: any, res: any) {
  const s = await getServer();
  return s(req, res);
}
