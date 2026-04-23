/**
 * CCXT MCP Server - 메인 엔트리 포인트
 * 이 파일은 CCXT MCP 서버를 시작하는 스크립트입니다.
 */

import { CcxtMcpServer } from "./server.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// 명령줄 인수 처리
const args = process.argv.slice(2);
let configPath = null;
let useSse = false;
let host = "127.0.0.1";
let port = 2298;

// --config 옵션 처리
const configIndex = args.indexOf('--config');
if (configIndex !== -1 && args.length > configIndex + 1) {
  configPath = args[configIndex + 1];
  console.error(`[INFO] Using custom config file: ${configPath}`);
}

// --sse 옵션 처리
if (args.includes('--sse')) {
  useSse = true;
}

// --host 옵션 처리
const hostIndex = args.indexOf('--host');
if (hostIndex !== -1 && args.length > hostIndex + 1) {
  host = args[hostIndex + 1];
}

// --port 옵션 처리
const portIndex = args.indexOf('--port');
if (portIndex !== -1 && args.length > portIndex + 1) {
  const parsedPort = Number.parseInt(args[portIndex + 1], 10);
  if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
    port = parsedPort;
  } else {
    console.error(`[ERROR] Invalid --port value: ${args[portIndex + 1]}`);
    process.exit(1);
  }
}

const showHelp = args.includes('--help') || args.includes('-h');
if (showHelp) {
  console.error(`
CCXT MCP Server

Usage:
  node dist/index.js [options]

Options:
  --config <path>   Path to config JSON file
  --sse             Run as HTTP+SSE server for remote MCP clients
  --host <host>     Host bind address for --sse mode (default: 127.0.0.1)
  --port <port>     Port for --sse mode (default: 2298)
  -h, --help        Show this help message
`);
  process.exit(0);
}

function resolveConfigPath(): string {
  return (
    configPath ||
    path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json")
  );
}

function readMcpBearerTokenFromConfig(configFilePath: string): string {
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Config file not found: ${configFilePath}`);
  }

  const raw = fs.readFileSync(configFilePath, "utf-8");
  const parsed = JSON.parse(raw);

  const tokenFromRoot =
    typeof parsed?.mcpBearerToken === "string"
      ? parsed.mcpBearerToken.trim()
      : "";

  if (tokenFromRoot) {
    return tokenFromRoot;
  }

  const tokenFromMcpServer =
    typeof parsed?.mcpServers?.["ccxt-mcp"]?.mcpBearerToken === "string"
      ? parsed.mcpServers["ccxt-mcp"].mcpBearerToken.trim()
      : "";

  if (tokenFromMcpServer) {
    return tokenFromMcpServer;
  }

  throw new Error(
    `Missing required 'mcpBearerToken' in config file: ${configFilePath}`,
  );
}

function readBearerTokenFromHeader(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  return token || null;
}

async function startSseServer() {
  const effectiveConfigPath = resolveConfigPath();
  const expectedBearerToken = readMcpBearerTokenFromConfig(effectiveConfigPath);

  const sessions = new Map<string, { transport: SSEServerTransport; mcpServer: CcxtMcpServer }>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      const presentedBearerToken = readBearerTokenFromHeader(req);
      if (!presentedBearerToken) {
        res.writeHead(401, { "content-type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Authorization: Bearer <token> required",
            },
            id: null,
          }),
        );
        return;
      }

      if (presentedBearerToken !== expectedBearerToken) {
        res.writeHead(403, { "content-type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid bearer token",
            },
            id: null,
          }),
        );
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/healthz") {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        res.end("ok");
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/sse") {
        const mcpServer = new CcxtMcpServer(effectiveConfigPath);
        const transport = new SSEServerTransport('/messages', res);

        sessions.set(transport.sessionId, { transport, mcpServer });
        res.on("close", async () => {
          sessions.delete(transport.sessionId);
          try {
            await transport.close();
          } catch {
            // Ignore close errors during shutdown/connection teardown.
          }
        });

        await mcpServer.connectTransport(transport);
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === "/messages") {
        const sessionId = requestUrl.searchParams.get("sessionId");
        if (!sessionId) {
          res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
          res.end("Missing sessionId query parameter");
          return;
        }

        const session = sessions.get(sessionId);
        if (!session) {
          res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
          res.end("No active SSE transport for sessionId");
          return;
        }

        await session.transport.handlePostMessage(req, res);
        return;
      }

      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    } catch (error) {
      console.error("[ERROR] SSE request handling failed:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      }
      res.end("Internal Server Error");
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, host, () => resolve());
  });

  console.error(`[INFO] CCXT MCP SSE server listening on http://${host}:${port}`);
}

// 서버 인스턴스 생성 및 시작
console.error(`[INFO] Starting CCXT MCP Server...`);
if (useSse) {
  startSseServer().catch((error) => {
    console.error("Failed to start SSE server:", error);
    process.exit(1);
  });
} else {
  const server = new CcxtMcpServer(configPath || undefined);
  server.start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
