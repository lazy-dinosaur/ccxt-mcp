/**
 * 시장 관련 도구들을 정의합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CcxtMcpServer } from '../server.js';

/**
 * 시장 관련 도구들을 서버에 등록합니다.
 */
export function registerMarketTools(server: McpServer, ccxtServer: CcxtMcpServer) {
  // 시장 정보 조회 도구
  server.tool(
    "fetchMarkets",
    "Fetch markets from a cryptocurrency exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')")
    },
    async ({ exchangeId }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);
        const markets = await exchange.loadMarkets();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(markets, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching markets: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 티커 정보 조회 도구
  server.tool(
    "fetchTicker",
    "Fetch ticker information for a symbol on an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')")
    },
    async ({ exchangeId, symbol }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);
        const ticker = await exchange.fetchTicker(symbol);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(ticker, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching ticker: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 모든 티커 정보 조회 도구
  server.tool(
    "fetchTickers",
    "Fetch all tickers from an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbols: z.array(z.string()).optional().describe("Optional list of specific symbols to fetch")
    },
    async ({ exchangeId, symbols }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);
        const tickers = await exchange.fetchTickers(symbols);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tickers, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching tickers: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 주문장 정보 조회 도구
  server.tool(
    "fetchOrderBook",
    "Fetch order book for a symbol on an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      limit: z.number().optional().describe("Limit the number of orders returned (optional)")
    },
    async ({ exchangeId, symbol, limit }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);
        const orderbook = await exchange.fetchOrderBook(symbol, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(orderbook, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching order book: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 거래 내역 조회 도구
  server.tool(
    "fetchTrades",
    "Fetch recent trades for a symbol on an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      since: z.number().optional().describe("Timestamp in ms to fetch trades since (optional)"),
      limit: z.number().optional().describe("Limit the number of trades returned (optional)")
    },
    async ({ exchangeId, symbol, since, limit }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);
        const trades = await exchange.fetchTrades(symbol, since, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(trades, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching trades: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // OHLCV 데이터 조회 도구 (캔들스틱 차트)
  server.tool(
    "fetchOHLCV",
    "Fetch OHLCV candlestick data for a symbol on an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbol: z.string().describe("Trading symbol (e.g., 'BTC/USDT')"),
      timeframe: z.string().default("1h").describe("Timeframe (e.g., '1m', '5m', '1h', '1d')"),
      since: z.number().optional().describe("Timestamp in ms to fetch data since (optional)"),
      limit: z.number().optional().describe("Limit the number of candles returned (optional)")
    },
    async ({ exchangeId, symbol, timeframe, since, limit }) => {
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId);

        // 거래소가 OHLCV 데이터를 지원하는지 확인
        if (!exchange.has['fetchOHLCV']) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support OHLCV data fetching`
              }
            ],
            isError: true
          };
        }
        
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(ohlcv, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching OHLCV data: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
