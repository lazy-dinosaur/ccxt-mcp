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
  password?: string; // Some exchanges require password (e.g. FTX)
  uid?: string; // Some exchanges require UID (e.g. Deribit)
  privateKey?: string; // For exchanges using private key auth
  walletAddress?: string; // For DEX exchanges
  subaccount?: string; // For exchanges with subaccount support
  defaultType?: "spot" | "margin" | "future" | "swap" | "option"; // Extended market types
  enableRateLimit?: boolean; // Rate limiter control
  timeout?: number; // Custom timeout
  verbose?: boolean; // Debug mode
  proxy?: string; // Proxy settings
  options?: {
    [key: string]: any; // Exchange-specific options
  };
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
  // 설정 파일 경로
  private configPath: string;

  /**
   * @param configPath 사용자 지정 설정 파일 경로 (선택 사항)
   */
  constructor(configPath?: string) {
    // MCP 서버 초기화
    this.server = new McpServer({
      name: "CCXT MCP",
      version: "1.0.0",
    });

    // 설정 파일 경로 설정
    this.configPath = configPath || path.join(
      os.homedir(),
      ".config",
      "Claude",
      "claude_desktop_config.json"
    );

    // 설정 파일에서 계정 로드 및 거래소 인스턴스 초기화
    this.loadAccountsFromConfig();

    // 리소스 및 도구 등록
    this.registerResources();
    this.registerTools();
  }

  /**
   * 설정 파일에서 계정 정보를 로드하고 CCXT 인스턴스를 생성합니다.
   */
  private async loadAccountsFromConfig() {
    try {
      console.log(`설정 파일을 로드합니다: ${this.configPath}`);
      const configContent = fs.readFileSync(this.configPath, "utf-8");

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
          `'mcpServers.ccxt-mcp.accounts' not found or not an array in ${this.configPath}. No accounts pre-loaded.`,
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

          // 특정 마켓 타입이 지원되는지 검증
          if (account.defaultType) {
            await exchangeInstance.loadMarkets();
            const supportedTypes = {
              spot: exchangeInstance.has.spot,
              margin: exchangeInstance.has.margin,
              future: exchangeInstance.has.futures,
              swap: exchangeInstance.has.swap,
              option: exchangeInstance.has.option
            };
            
            if (!supportedTypes[account.defaultType]) {
              console.error(
                `${account.exchangeId} does not support ${account.defaultType} trading. ` +
                `Supported types: ${Object.entries(supportedTypes)
                  .filter(([_, supported]) => supported)
                  .map(([type]) => type)
                  .join(', ')}`
              );
              continue;
            }
          }

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
        `Failed to load or parse configuration file ${this.configPath}:`,
        error,
      );
      console.log('계정 설정이 로드되지 않았습니다. 공개 거래소 데이터만 사용 가능합니다.');
    }
  } // loadAccountsFromConfig 메소드 닫는 괄호

  /**
   * 선물 주문을 위한 거래소별 파라미터 반환
   */
  private getFutureParams(exchangeId: string) {
    return (
      {
        binance: { type: "future", marginMode: "cross" },
        bybit: { category: "linear" },
        okx: { instType: "SWAP" },
        kucoin: { type: "future" },
      }[exchangeId.toLowerCase()] || {}
    );
  }

  /**
   * 선물 주문 실행 (자동 재시도 포함)
   */
  async executeFutureOrder(
    accountName: string,
    orderParams: {
      symbol: string;
      type: string;
      side: string;
      amount: number;
      price?: number;
      params?: any;
    },
  ) {
    const exchange = this.getExchangeInstance(accountName);
    const futureParams = this.getFutureParams(exchange.id);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await exchange.createOrder(
          orderParams.symbol,
          orderParams.type,
          orderParams.side,
          orderParams.amount,
          orderParams.price,
          {
            ...(orderParams.params || {}),
            ...futureParams,
          },
        );
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }

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
  /**
   * 로드된 모든 계정 이름 목록을 반환합니다.
   */
  getAccountNames(): string[] {
    return Object.keys(this.exchangeInstances);
  }


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
