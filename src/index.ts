/**
 * CCXT MCP Server - 메인 엔트리 포인트
 * 이 파일은 CCXT MCP 서버를 시작하는 스크립트입니다.
 */

import { CcxtMcpServer } from './server.js';

// 서버 인스턴스 생성 및 시작
const server = new CcxtMcpServer();
server.start().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
