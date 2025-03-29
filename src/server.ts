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

import { registerExchangeResources } from "./resources/exchanges.js"; // Restore .js
import { registerMarketResources } from "./resources/markets.js"; // Restore .js
import { registerPriceResources } from "./resources/prices.js"; // Restore .js
import { registerOrderBookResources } from "./resources/orderbooks.js"; // Restore .js
import { registerMarketTools } from "./tools/market-tools.js"; // Restore .js
import { registerOrderTools } from "./tools/order-tools.js"; // Restore .js
import { registerAccountTools } from "./tools/account-tools.js"; // Restore .js

/**
 * CCXT MCP 서버 클래스
 * MCP 프로토콜을 통해 CCXT 기능을 노출합니다.
 */
export class CcxtMcpServer {
  private server: McpServer;
  private exchangeInstances: Record<string, Exchange> = {}; // Use imported Exchange type

  constructor() {
    // MCP 서버 초기화
    this.server = new McpServer({
      name: "CCXT MCP",
      version: "1.0.0",
    });

    this.registerResources();
    this.registerTools();
  }

  /**
   * 거래소 인스턴스를 가져오거나 생성합니다. 시장 유형(spot/futures)을 고려합니다.
   */
  getExchangeInstance(
    exchangeId: string,
    marketType: "spot" | "futures" = "spot" // 기본값을 'spot'으로 설정
  ): Exchange {
    const instanceKey = `${exchangeId}-${marketType}`; // 현물/선물 구분 키

    // Use imported Exchange type
    if (!this.exchangeInstances[instanceKey]) {
      // Log the available exchanges for debugging
      // console.error("Available CCXT exchanges:", ccxt.exchanges); // 필요시 주석 해제
      // CCXT에서 지원하는 거래소인지 확인
      if (!ccxt.exchanges.includes(exchangeId)) {
        // 'in' 대신 'includes' 사용
        // Check against ccxt.exchanges (which is an array)
        console.error(
          `Exchange ID '${exchangeId}' not found in ccxt.exchanges.`
        ); // Add log here too
        throw new Error(`Unsupported exchange: ${exchangeId}`);
      }

      const exchangeOptions = {
        options: {
          defaultType: marketType, // 'spot' 또는 'futures' 설정
        },
      };

      // @ts-ignore - CCXT 타입 문제 및 동적 생성
      this.exchangeInstances[instanceKey] = new ccxt[exchangeId](
        exchangeOptions
      );
      console.log(
        `Created new CCXT instance for ${exchangeId} (${marketType})`
      );
    }

    return this.exchangeInstances[instanceKey];
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
