/**
 * 시장 관련 리소스를 정의합니다.
 */

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import ccxt from "ccxt";
import { CcxtMcpServer } from "../server.js";

/**
 * 시장 관련 리소스를 서버에 등록합니다.
 */
export function registerMarketResources(
  server: McpServer,
  ccxtServer: CcxtMcpServer
) {
  // 특정 거래소의 시장 정보 리소스
  server.resource(
    "markets",
    new ResourceTemplate("markets://exchange/{exchangeId}", {
      list: async () => {
        // 모든 거래소의 기본 정보 반환
        const exchanges = ccxt.exchanges.slice(0, 10); // 예제에서는 처음 10개만
        return {
          resources: exchanges.map((exchangeId) => ({
            uri: `markets://exchange/${exchangeId}`,
            name: `${exchangeId} Markets`,
          })),
        };
      },
      complete: {
        exchangeId: async (value) => {
          // 거래소 ID 자동완성 제공
          return ccxt.exchanges
            .filter((exchange) =>
              exchange.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 10);
        },
      },
    }),
    async (uri, variables) => {
      const { exchangeId } = variables;
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId as string);
        const markets = await exchange.loadMarkets();

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(markets),
              contentType: "application/json",
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: (error as Error).message }),
              contentType: "application/json",
            },
          ],
        };
      }
    }
  );

  // 특정 거래소의 특정 심볼에 대한 시장 정보 리소스
  server.resource(
    "market",
    new ResourceTemplate("market://exchange/{exchangeId}/{symbol}", {
      list: undefined,
      complete: {
        exchangeId: async (value) => {
          return ccxt.exchanges
            .filter((exchange) =>
              exchange.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 10);
        },
        // @ts-ignore - Callback signature mismatch with SDK type
        symbol: async (value, variables, context) => {
          // Add third argument 'context'
          // Change signature to accept variables object
          const exchangeId = variables?.exchangeId; // Get exchangeId from variables
          if (!exchangeId) return [];

          try {
            // 공개 인스턴스 사용 (자동완성용)
            const exchange = ccxtServer.getPublicExchangeInstance(
              exchangeId as string
            );
            await exchange.loadMarkets();
            const symbols = exchange.symbols || [];

            return symbols
              .filter((symbol) =>
                symbol.toLowerCase().includes(value.toLowerCase())
              )
              .slice(0, 10);
          } catch (error) {
            return [];
          }
        },
      },
    }),
    async (uri, variables) => {
      const { exchangeId, symbol } = variables;

      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId as string);
        await exchange.loadMarkets();
        const market = exchange.market(symbol as string);

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(market),
              contentType: "application/json",
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: (error as Error).message }),
              contentType: "application/json",
            },
          ],
        };
      }
    }
  );
}
