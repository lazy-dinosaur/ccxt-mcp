/**
 * 주문 관련 도구들을 정의합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CcxtMcpServer } from "../server.js";

/**
 * 주문 관련 도구들을 서버에 등록합니다.
 */
export function registerOrderTools(
  server: McpServer,
  ccxtServer: CcxtMcpServer,
) {
  // 주문 생성 도구
  server.tool(
    "createOrder",
    "Create a new order on an exchange (requires API credentials)",
    {
      exchangeId: z
        .string()
        .describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      marketType: z
        .enum(["spot", "futures"])
        .describe("Market type: 'spot' or 'futures'"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      type: z
        .enum(["market", "limit"])
        .describe("Order type: 'market' or 'limit'"),
      side: z.enum(["buy", "sell"]).describe("Order side: 'buy' or 'sell'"),
      amount: z.number().describe("Amount of base currency to trade"),
      price: z
        .number()
        .optional()
        .describe("Price per unit (required for limit orders)"),
      params: z
        .record(z.any())
        .optional()
        .describe("Additional exchange-specific parameters"),
    },
    async ({
      exchangeId,
      marketType,
      symbol,
      type,
      side,
      amount,
      price,
      params,
    }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId, marketType);

        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first.",
              },
            ],
            isError: true,
          };
        }

        // 주문 유형이 limit인데 가격이 없는 경우
        if (type === "limit" && price === undefined) {
          return {
            content: [
              {
                type: "text",
                text: "Price is required for limit orders",
              },
            ],
            isError: true,
          };
        }

        const order = await exchange.createOrder(
          symbol,
          type,
          side,
          amount,
          price,
          params,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating order: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 주문 취소 도구
  server.tool(
    "cancelOrder",
    "Cancel an existing order on an exchange (requires API credentials)",
    {
      exchangeId: z
        .string()
        .describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      marketType: z
        .enum(["spot", "futures"])
        .describe("Market type: 'spot' or 'futures'"),
      id: z.string().describe("Order ID to cancel"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      params: z
        .record(z.any())
        .optional()
        .describe("Additional exchange-specific parameters"),
    },
    async ({ exchangeId, marketType, id, symbol, params }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId, marketType);

        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first.",
              },
            ],
            isError: true,
          };
        }

        const result = await exchange.cancelOrder(id, symbol, params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error canceling order: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 주문 조회 도구
  server.tool(
    "fetchOrder",
    "Fetch information about a specific order (requires API credentials)",
    {
      exchangeId: z
        .string()
        .describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      marketType: z
        .enum(["spot", "futures"])
        .describe("Market type: 'spot' or 'futures'"),
      id: z.string().describe("Order ID to fetch"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      params: z
        .record(z.any())
        .optional()
        .describe("Additional exchange-specific parameters"),
    },
    async ({ exchangeId, marketType, id, symbol, params }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId, marketType);

        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first.",
              },
            ],
            isError: true,
          };
        }

        // fetchOrder 메서드가 지원되는지 확인
        if (!exchange.has["fetchOrder"]) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching order details`,
              },
            ],
            isError: true,
          };
        }

        const order = await exchange.fetchOrder(id, symbol, params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching order: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 열린 주문 조회 도구
  server.tool(
    "fetchOpenOrders",
    "Fetch all open orders (requires API credentials)",
    {
      exchangeId: z
        .string()
        .describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      marketType: z
        .enum(["spot", "futures"])
        .describe("Market type: 'spot' or 'futures'"),
      symbol: z
        .string()
        .optional()
        .describe("Trading symbol (e.g., 'BTC/USDT')"),
      since: z
        .number()
        .optional()
        .describe("Timestamp in ms to fetch orders since (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Limit the number of orders returned (optional)"),
      params: z
        .record(z.any())
        .optional()
        .describe("Additional exchange-specific parameters"),
    },
    async ({ exchangeId, marketType, symbol, since, limit, params }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId, marketType);

        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first.",
              },
            ],
            isError: true,
          };
        }

        // fetchOpenOrders 메서드가 지원되는지 확인
        if (!exchange.has["fetchOpenOrders"]) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching open orders`,
              },
            ],
            isError: true,
          };
        }

        const openOrders = await exchange.fetchOpenOrders(
          symbol,
          since,
          limit,
          params,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(openOrders, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching open orders: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 마감된 주문 조회 도구
  server.tool(
    "fetchClosedOrders",
    "Fetch all closed orders (requires API credentials)",
    {
      exchangeId: z
        .string()
        .describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      marketType: z
        .enum(["spot", "futures"])
        .describe("Market type: 'spot' or 'futures'"),
      symbol: z
        .string()
        .optional()
        .describe("Trading symbol (e.g., 'BTC/USDT')"),
      since: z
        .number()
        .optional()
        .describe("Timestamp in ms to fetch orders since (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Limit the number of orders returned (optional)"),
      params: z
        .record(z.any())
        .optional()
        .describe("Additional exchange-specific parameters"),
    },
    async ({ exchangeId, marketType, symbol, since, limit, params }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId, marketType);

        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first.",
              },
            ],
            isError: true,
          };
        }

        // fetchClosedOrders 메서드가 지원되는지 확인
        if (!exchange.has["fetchClosedOrders"]) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching closed orders`,
              },
            ],
            isError: true,
          };
        }

        const closedOrders = await exchange.fetchClosedOrders(
          symbol,
          since,
          limit,
          params,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(closedOrders, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching closed orders: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
