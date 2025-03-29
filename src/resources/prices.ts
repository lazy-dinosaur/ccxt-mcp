/**
 * 가격 관련 리소스를 정의합니다.
 */

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import ccxt from "ccxt";
import { CcxtMcpServer } from "../server.js";

/**
 * 가격 관련 리소스를 서버에 등록합니다.
 */
export function registerPriceResources(
  server: McpServer,
  ccxtServer: CcxtMcpServer
) {
  // 특정 거래소의 특정 심볼에 대한 티커 정보 리소스
  server.resource(
    "ticker",
    new ResourceTemplate("ticker://exchange/{exchangeId}/{symbol}", {
      list: undefined,
      complete: {
        exchangeId: async (value) => {
          // 거래소 ID 자동완성
          return ccxt.exchanges
            .filter((exchange) =>
              exchange.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 10);
        },
        // @ts-ignore - Callback signature mismatch with SDK type
        symbol: async (value, variables, context) => {
          // 지정된 거래소의 심볼 자동완성
          const exchangeId = variables?.exchangeId;
          if (!exchangeId) return [];

          try {
            const exchange = ccxtServer.getExchangeInstance(
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
        const exchange = ccxtServer.getExchangeInstance(exchangeId as string);
        const ticker = await exchange.fetchTicker(symbol as string);

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(ticker),
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

  // 특정 거래소의 모든 티커 정보
  server.resource(
    "tickers",
    new ResourceTemplate("tickers://exchange/{exchangeId}", {
      list: undefined,
      complete: {
        exchangeId: async (value) => {
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
        const exchange = ccxtServer.getExchangeInstance(exchangeId as string);
        const tickers = await exchange.fetchTickers();

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(tickers),
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
