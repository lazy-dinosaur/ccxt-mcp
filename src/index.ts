/**
 * CCXT MCP Server - 메인 엔트리 포인트
 * 이 파일은 CCXT MCP 서버를 시작하는 스크립트입니다.
 */

import { CcxtMcpServer } from "./server.js";

// 명령줄 인수 처리
const args = process.argv.slice(2);
let configPath = null;

// --config 옵션 처리
const configIndex = args.indexOf('--config');
if (configIndex !== -1 && args.length > configIndex + 1) {
  configPath = args[configIndex + 1];
  console.error(`[INFO] Using custom config file: ${configPath}`);
}

// 서버 인스턴스 생성 및 시작
console.error(`[INFO] Starting CCXT MCP Server...`);
const server = new CcxtMcpServer(configPath);
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
