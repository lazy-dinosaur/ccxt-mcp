/**
 * 설정 파일 로드 테스트 스크립트
 * 이 스크립트는 설정 파일을 로드하고 구조를 출력합니다.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 명령줄 인수 처리
const args = process.argv.slice(2);
let configPath = path.join(__dirname, "examples", "config-example.json");

// --config 옵션 처리
const configIndex = args.indexOf("--config");
if (configIndex !== -1 && args.length > configIndex + 1) {
  configPath = args[configIndex + 1];
}

// console.log(`설정 파일 경로: ${configPath}`);

try {
  // 설정 파일 읽기
  const configContent = fs.readFileSync(configPath, "utf-8");

  // JSON 파싱
  const config = JSON.parse(configContent);

  // 계정 정보 확인
  if (Array.isArray(config.accounts)) {
    // console.log(`직접 accounts 배열 발견: ${config.accounts.length}개의 계정`);
    config.accounts.forEach((account, index) => {
      // console.log(`계정 ${index + 1}: ${account.name} (${account.exchangeId})`);
    });
  } else if (
    config.mcpServers &&
    config.mcpServers["ccxt-mcp"] &&
    Array.isArray(config.mcpServers["ccxt-mcp"].accounts)
  ) {
    const accounts = config.mcpServers["ccxt-mcp"].accounts;
    // console.log(`mcpServers.ccxt-mcp.accounts 경로에서 ${accounts.length}개의 계정 발견`);
    accounts.forEach((account, index) => {
      // console.log(`계정 ${index + 1}: ${account.name} (${account.exchangeId})`);
    });
  } else {
    console.error("설정 파일에서 계정 정보를 찾을 수 없습니다");
    // console.log('설정 파일 내용:', JSON.stringify(config, null, 2));
  }
} catch (error) {
  console.error("설정 파일 처리 중 오류 발생:", error);
}
