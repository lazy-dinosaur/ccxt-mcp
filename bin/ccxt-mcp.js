#!/usr/bin/env node

/**
 * ccxt-mcp CLI 실행 파일
 * 이 파일은 npx로 ccxt-mcp를 실행할 수 있게 해줍니다.
 */

import { CcxtMcpServer } from '../dist/server.js';
import { parseArgs } from 'node:util';

// 명령행 인수 파싱
const options = {
  config: {
    type: 'string',
    short: 'c',
    default: undefined
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
};

try {
  const { values } = parseArgs({ options, allowPositionals: false });

  // 도움말 표시
  if (values.help) {
    console.log(`
ccxt-mcp - CCXT 암호화폐 거래소 MCP 서버

사용법:
  npx @lazydino/ccxt-mcp [옵션]

옵션:
  -c, --config <파일 경로>   설정 파일의 경로를 지정합니다. 기본값: ~/.config/Claude/claude_desktop_config.json
  -h, --help                 도움말을 표시합니다.

설정 파일 형식 예시:
{
  "mcpServers": {
    "ccxt-mcp": {
      "accounts": [
        {
          "name": "my-binance",
          "exchangeId": "binance",
          "apiKey": "YOUR_API_KEY",
          "secret": "YOUR_SECRET_KEY"
        }
      ]
    }
  }
}
`);
    process.exit(0);
  }

  // 서버 인스턴스 생성 및 시작
  console.log("CCXT MCP 서버를 시작합니다...");
  const server = new CcxtMcpServer(values.config);
  server.start().catch(error => {
    console.error("서버 시작 실패:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("CCXT MCP 서버 초기화 실패:", error);
  process.exit(1);
}
