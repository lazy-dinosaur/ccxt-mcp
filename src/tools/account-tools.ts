/**
 * 계정 관련 도구들을 정의합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CcxtMcpServer } from '../server.js';

/**
 * 계정 관련 도구들을 서버에 등록합니다.
 */
export function registerAccountTools(server: McpServer, ccxtServer: CcxtMcpServer) {
  // API 키 설정 도구
  server.tool(
    "setExchangeCredentials",
    "Set API credentials for an exchange",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      apiKey: z.string().describe("API Key"),
      secret: z.string().describe("API Secret"),
      password: z.string().optional().describe("Password (if required by the exchange)"),
      uid: z.string().optional().describe("UID (if required by the exchange)")
    },
    async ({ exchangeId, apiKey, secret, password, uid }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId);
        
        // API 키 설정
        exchange.apiKey = apiKey;
        exchange.secret = secret;
        
        if (password) {
          exchange.password = password;
        }
        
        if (uid) {
          exchange.uid = uid;
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully set API credentials for ${exchangeId}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting API credentials: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 계정 잔액 조회 도구
  server.tool(
    "fetchBalance",
    "Fetch account balance from an exchange (requires API credentials)",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')")
    },
    async ({ exchangeId }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId);
        
        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first."
              }
            ],
            isError: true
          };
        }
        
        const balance = await exchange.fetchBalance();
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(balance, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching balance: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 입금 내역 조회 도구
  server.tool(
    "fetchDeposits",
    "Fetch deposit history from an exchange (requires API credentials)",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      code: z.string().optional().describe("Currency code (e.g., 'BTC', 'ETH')"),
      since: z.number().optional().describe("Timestamp in ms to fetch deposits since (optional)"),
      limit: z.number().optional().describe("Limit the number of deposits returned (optional)")
    },
    async ({ exchangeId, code, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId);
        
        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first."
              }
            ],
            isError: true
          };
        }
        
        // fetchDeposits 메서드가 지원되는지 확인
        if (!exchange.has['fetchDeposits']) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching deposits`
              }
            ],
            isError: true
          };
        }
        
        const deposits = await exchange.fetchDeposits(code, since, limit);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deposits, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching deposits: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 출금 내역 조회 도구
  server.tool(
    "fetchWithdrawals",
    "Fetch withdrawal history from an exchange (requires API credentials)",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      code: z.string().optional().describe("Currency code (e.g., 'BTC', 'ETH')"),
      since: z.number().optional().describe("Timestamp in ms to fetch withdrawals since (optional)"),
      limit: z.number().optional().describe("Limit the number of withdrawals returned (optional)")
    },
    async ({ exchangeId, code, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId);
        
        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first."
              }
            ],
            isError: true
          };
        }
        
        // fetchWithdrawals 메서드가 지원되는지 확인
        if (!exchange.has['fetchWithdrawals']) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching withdrawals`
              }
            ],
            isError: true
          };
        }
        
        const withdrawals = await exchange.fetchWithdrawals(code, since, limit);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(withdrawals, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching withdrawals: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 내 거래 내역 조회 도구
  server.tool(
    "fetchMyTrades",
    "Fetch personal trade history from an exchange (requires API credentials)",
    {
      exchangeId: z.string().describe("Exchange ID (e.g., 'binance', 'coinbase')"),
      symbol: z.string().optional().describe("Trading symbol (e.g., 'BTC/USDT')"),
      since: z.number().optional().describe("Timestamp in ms to fetch trades since (optional)"),
      limit: z.number().optional().describe("Limit the number of trades returned (optional)")
    },
    async ({ exchangeId, symbol, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(exchangeId);
        
        // API 키가 설정되어 있는지 확인
        if (!exchange.apiKey || !exchange.secret) {
          return {
            content: [
              {
                type: "text",
                text: "API credentials not set. Please use setExchangeCredentials tool first."
              }
            ],
            isError: true
          };
        }
        
        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has['fetchMyTrades']) {
          return {
            content: [
              {
                type: "text",
                text: `Exchange ${exchangeId} does not support fetching personal trades`
              }
            ],
            isError: true
          };
        }
        
        const trades = await exchange.fetchMyTrades(symbol, since, limit);
        
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
              text: `Error fetching personal trades: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
