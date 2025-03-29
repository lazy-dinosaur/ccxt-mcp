#!/usr/bin/env node

/**
 * ccxt-mcp CLI 실행 파일
 * 이 파일은 npx로 ccxt-mcp를 실행할 수 있게 해줍니다.
 */

import { CcxtMcpServer } from "../dist/server.js";
import { parseArgs } from "node:util";

// 명령행 인수 파싱
const options = {
  config: {
    type: "string",
    short: "c",
    default: undefined,
  },
  help: {
    type: "boolean",
    short: "h",
    default: false,
  },
};

try {
  const { values } = parseArgs({ options, allowPositionals: false });

  // 서버 인스턴스 생성 및 시작
  const server = new CcxtMcpServer(values.config);
  server.start().catch((error) => {
    console.error("서버 시작 실패:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("CCXT MCP 서버 초기화 실패:", error);
  process.exit(1);
}
