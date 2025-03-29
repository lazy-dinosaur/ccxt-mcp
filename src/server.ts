/**
 * CCXT MCP 서버 클래스 구현
 * 이 파일은 MCP 서버와 CCXT 라이브러리 통합을 구현합니다.
 */

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js"; // Restore original path
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; // Restore original path
import { URL } from "url";
import { z } from "zod";
import ccxt, { Exchange } from "ccxt"; // Import Exchange type
import fs from "fs";
import path from "path";
import os from "os";

import { registerExchangeResources } from "./resources/exchanges.js"; // Restore .js
import { registerMarketResources } from "./resources/markets.js"; // Restore .js
import { registerPriceResources } from "./resources/prices.js"; // Restore .js
import { registerOrderBookResources } from "./resources/orderbooks.js"; // Restore .js
import { registerMarketTools } from "./tools/market-tools.js"; // Restore .js
import { registerOrderTools } from "./tools/order-tools.js"; // Restore .js
import { registerAccountTools } from "./tools/account-tools.js"; // Restore .js

// 설정 파일의 계정 구조 정의
interface AccountConfig {
  name: string;
  exchangeId: string;
  apiKey: string;
  secret: string;
  defaultType?: "spot" | "futures"; // Optional, default can be handled
}

/**
 * CCXT MCP 서버 클래스
 * MCP 프로토콜을 통해 CCXT 기능을 노출합니다.
 */
export class CcxtMcpServer {
  private server: McpServer;
  // Key: account name from config, Value: Authenticated CCXT Exchange instance
  private exchangeInstances: Record<string, Exchange> = {};
  // Key: `${exchangeId}-${marketType}`, Value: Public (unauthenticated) CCXT Exchange instance
  private publicExchangeInstances: Record<string, Exchange> = {};

  constructor() {
    // MCP 서버 초기화
    this.server = new McpServer({
      name: "CCXT MCP",
      version: "1.0.0",
    });

    // 설정 파일에서 계정 로드 및 거래소 인스턴스 초기화
    this.loadAccountsFromConfig();

    // 리소스 및 도구 등록
    this.registerResources();
    this.registerTools();
  }

  /**
   * 설정 파일에서 계정 정보를 로드하고 CCXT 인스턴스를 생성합니다.
   */
  private loadAccountsFromConfig() {
    const configPath = path.join(
      os.homedir(),
      ".config",
      "Claude",
      "claude_desktop_config.json",
    );

    try {
      const configContent = fs.readFileSync(configPath, "utf-8");

      let config;
      try {
        config = JSON.parse(configContent);
      } catch (jsonError) {
        throw new Error(
          `Invalid JSON format in config file: ${jsonError.message}`,
        );
      }

      // 새로운 구조에서는 mcpServers.ccxt-mcp.accounts에 계정 정보가 있습니다
      const mcpConfig = config?.mcpServers?.["ccxt-mcp"];
      if (!mcpConfig || !Array.isArray(mcpConfig.accounts)) {
        console.warn(
          `'mcpServers.ccxt-mcp.accounts' not found or not an array in ${configPath}. No accounts pre-loaded.`,
        );
        return;
      }

      const accounts: AccountConfig[] = mcpConfig.accounts;

      const loadedAccountNames = new Set<string>();
      for (const account of accounts) {
        // 필수 필드 검증
        if (
          !account.name ||
          !account.exchangeId ||
          !account.apiKey ||
          !account.secret
        ) {
          console.warn(
            `Skipping account due to missing fields: ${JSON.stringify(account)}`,
          );
          continue;
        }

        // 중복 계정 이름 검사
        if (loadedAccountNames.has(account.name)) {
          console.error(`Duplicate account name '${account.name}'. Skipping.`);
          continue;
        }
        loadedAccountNames.add(account.name);

        // 지원되는 거래소인지 확인
        if (!ccxt.exchanges.includes(account.exchangeId)) {
          console.error(
            `Unsupported exchange ID '${account.exchangeId}' for account '${account.name}'. Supported exchanges: ${ccxt.exchanges.join(", ")}`,
          );
          continue;
        }

        try {
          const exchangeOptions = {
            apiKey: account.apiKey,
            secret: account.secret,
            options: {
              defaultType: account.defaultType || "spot", // Use defaultType or fallback to 'spot'
            },
          };

          // @ts-ignore - CCXT dynamic instantiation
          const exchangeInstance = new ccxt[account.exchangeId](
            exchangeOptions,
          );

          // Store the instance using the account name as the key
          this.exchangeInstances[account.name] = exchangeInstance;
        } catch (error) {
          // console.error(
          //   `Failed to create CCXT instance for account '${account.name}' (${account.exchangeId}):`,
          //   error,
          // );
        }
      }
    } catch (error) {
      console.error(
        `Failed to load or parse configuration file ${configPath}:`,
        error,
      );
      // Consider if the server should fail to start if config is essential
    }
  } // loadAccountsFromConfig 메소드 닫는 괄호

  /**
   * 설정 파일에서 미리 로드된 특정 계정 이름에 해당하는 인증된 거래소 인스턴스를 가져옵니다.
   * @param accountName 설정 파일에 정의된 계정의 'name'
   * @returns 요청된 계정에 대한 CCXT 거래소 인스턴스
   * @throws 계정을 찾을 수 없는 경우 오류 발생
   */
  getExchangeInstance(accountName: string): Exchange {
    const instance = this.exchangeInstances[accountName];
    if (!instance) {
      console.error(
        `No pre-loaded exchange instance found for account name: ${accountName}`,
      );
      // Consider listing available account names: Object.keys(this.exchangeInstances).join(', ')
      throw new Error(
        `Account configuration not found or failed to load for: ${accountName}`,
      );
    }
    return instance;
  }

  /**
   * 공개 데이터 접근을 위한 인증되지 않은 거래소 인스턴스를 가져오거나 생성합니다.
   * @param exchangeId 거래소 ID (e.g., 'binance')
   * @param marketType 시장 유형 ('spot' or 'futures'), 기본값 'spot'
   * @returns 요청된 거래소/시장 유형에 대한 공개 CCXT 인스턴스
   * @throws 지원되지 않는 거래소 ID인 경우 오류 발생
   */
  getPublicExchangeInstance(
    exchangeId: string,
    marketType: "spot" | "futures" = "spot",
  ): Exchange {
    const instanceKey = `${exchangeId}-${marketType}`;

    if (!this.publicExchangeInstances[instanceKey]) {
      if (!ccxt.exchanges.includes(exchangeId)) {
        console.error(
          `Exchange ID '${exchangeId}' not found in ccxt.exchanges for public instance.`,
        );
        throw new Error(`Unsupported exchange for public data: ${exchangeId}`);
      }

      const exchangeOptions = {
        options: {
          defaultType: marketType,
        },
      };

      try {
        // @ts-ignore - CCXT dynamic instantiation without credentials
        this.publicExchangeInstances[instanceKey] = new ccxt[exchangeId](
          exchangeOptions,
        );
      } catch (error) {
        console.error(
          `Failed to create public CCXT instance for ${exchangeId} (${marketType}):`,
          error,
        );
        throw error; // Re-throw the error after logging
      }
    }

    return this.publicExchangeInstances[instanceKey];
  }

  /**
   * MCP 리소스를 등록합니다.
   */
  private registerResources() {
    registerExchangeResources(this.server, this);
    registerMarketResources(this.server, this);
    registerPriceResources(this.server, this);
    registerOrderBookResources(this.server, this);
  }

  /**
   * MCP 도구를 등록합니다.
   */
  private registerTools() {
    registerMarketTools(this.server, this);
    registerOrderTools(this.server, this);
    registerAccountTools(this.server, this);
  }

  /**
   * 서버를 시작합니다.
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("CCXT MCP Server started");
  }
}
