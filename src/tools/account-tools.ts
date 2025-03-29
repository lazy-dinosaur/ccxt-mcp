/**
 * 계정 관련 도구들을 정의합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CcxtMcpServer } from "../server.js";

/**
 * 계정 관련 도구들을 서버에 등록합니다.
 */
export function registerAccountTools(
  server: McpServer,
  ccxtServer: CcxtMcpServer
) {
  // 계정 잔액 조회 도구
  server.tool(
    "fetchBalance",
    "Fetch account balance for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
    },
    async ({ accountName }) => {
      try {
        // 설정 파일에서 로드된 인스턴스 가져오기
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // getExchangeInstance가 성공하면 인증은 보장됨

        const balance = await exchange.fetchBalance();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(balance, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching balance for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 입금 내역 조회 도구
  server.tool(
    "fetchDeposits",
    "Fetch deposit history for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      code: z
        .string()
        .optional()
        .describe("Currency code (e.g., 'BTC', 'ETH')"),
      since: z
        .number()
        .optional()
        .describe("Timestamp in ms to fetch deposits since (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Limit the number of deposits returned (optional)"),
    },
    async ({ accountName, code, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // getExchangeInstance가 성공하면 인증은 보장됨

        // fetchDeposits 메서드가 지원되는지 확인
        if (!exchange.has["fetchDeposits"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching deposits`,
              },
            ],
            isError: true,
          };
        }

        const deposits = await exchange.fetchDeposits(code, since, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deposits, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching deposits for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 출금 내역 조회 도구
  server.tool(
    "fetchWithdrawals",
    "Fetch withdrawal history for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      code: z
        .string()
        .optional()
        .describe("Currency code (e.g., 'BTC', 'ETH')"),
      since: z
        .number()
        .optional()
        .describe("Timestamp in ms to fetch withdrawals since (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Limit the number of withdrawals returned (optional)"),
    },
    async ({ accountName, code, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // getExchangeInstance가 성공하면 인증은 보장됨

        // fetchWithdrawals 메서드가 지원되는지 확인
        if (!exchange.has["fetchWithdrawals"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching withdrawals`,
              },
            ],
            isError: true,
          };
        }

        const withdrawals = await exchange.fetchWithdrawals(code, since, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(withdrawals, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching withdrawals for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 내 거래 내역 조회 도구
  server.tool(
    "fetchMyTrades",
    "Fetch personal trade history for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      symbol: z
        .string()
        .optional()
        .describe("Trading symbol (e.g., 'BTC/USDT')"),
      since: z
        .number()
        .optional()
        .describe("Timestamp in ms to fetch trades since (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Limit the number of trades returned (optional)"),
    },
    async ({ accountName, symbol, since, limit }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // getExchangeInstance가 성공하면 인증은 보장됨

        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has["fetchMyTrades"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching personal trades`,
              },
            ],
            isError: true,
          };
        }

        const trades = await exchange.fetchMyTrades(symbol, since, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(trades, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching personal trades for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
