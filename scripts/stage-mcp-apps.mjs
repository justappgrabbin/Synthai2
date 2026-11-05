import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist/mcp-apps", { recursive: true });
await copyFile("client/src/mcp-apps/console.html", "dist/mcp-apps/console.html");
