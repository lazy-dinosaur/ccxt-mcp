/**
 * 주문장 관련 리소스를 정의합니다.
 */

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import ccxt from "ccxt";
import { CcxtMcpServer } from "../server.js";

/**
 * 주문장 관련 리소스를 서버에 등록합니다.
 */
export function registerOrderBookResources(
  server: McpServer,
  ccxtServer: CcxtMcpServer
) {
  // 특정 거래소의 특정 심볼에 대한 주문장 정보 리소스
  server.resource(
    "orderbook",
    new ResourceTemplate(
      "orderbook://exchange/{exchangeId}/{symbol}/{limit?}",
      {
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
            const exchangeId = variables?.exchangeId;
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
      }
    ),
    async (uri, variables) => {
      const { exchangeId, symbol, limit } = variables;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;

      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId as string);
        const orderbook = await exchange.fetchOrderBook(
          symbol as string,
          limitNum
        );

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(orderbook),
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

  // 특정 거래소의 특정 심볼에 대한 L2 주문장 정보 리소스
  server.resource(
    "l2orderbook",
    new ResourceTemplate("l2orderbook://exchange/{exchangeId}/{symbol}", {
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
          const exchangeId = variables?.exchangeId;
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
        // L2 주문장은 더 자세한 주문장 정보를 제공
        const orderbook = await exchange.fetchL2OrderBook(symbol as string);

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(orderbook),
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
