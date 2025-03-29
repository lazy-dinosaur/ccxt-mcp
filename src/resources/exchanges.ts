/**
 * 거래소 관련 리소스를 정의합니다.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import ccxt from 'ccxt';
import { CcxtMcpServer } from '../server.js';

/**
 * 거래소 관련 리소스를 서버에 등록합니다.
 */
export function registerExchangeResources(server: McpServer, ccxtServer: CcxtMcpServer) {
  // 거래소 목록 리소스
  server.resource(
    "exchanges",
    "exchanges://list",
    async (uri) => {
      const exchanges = ccxt.exchanges;
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(exchanges),
            contentType: "application/json"
          }
        ]
      };
    }
  );

  // 특정 거래소 정보 리소스
  server.resource(
    "exchange-info",
    new ResourceTemplate("exchange://info/{exchangeId}", {
      list: async () => {
        // 모든 거래소의 기본 정보 반환
        const exchanges = ccxt.exchanges.slice(0, 20); // 처음 20개만
        return {
          resources: exchanges.map(exchangeId => ({
            uri: `exchange://info/${exchangeId}`,
            name: `${exchangeId} Info`
          }))
        };
      },
      complete: {
        exchangeId: async (value) => {
          // 거래소 ID 자동완성 제공
          return ccxt.exchanges.filter(exchange => 
            exchange.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 10);
        }
      }
    }),
    async (uri, variables) => {
      const { exchangeId } = variables;
      try {
        // 공개 인스턴스 사용
        const exchange = ccxtServer.getPublicExchangeInstance(exchangeId as string);

        // 거래소 기본 정보
        const info = {
          id: exchange.id,
          name: exchange.name,
          countries: exchange.countries,
          urls: exchange.urls,
          version: exchange.version,
          certified: exchange.certified,
          pro: exchange.pro,
          has: exchange.has,
          timeframes: exchange.timeframes,
          requiredCredentials: exchange.requiredCredentials,
          precisionMode: exchange.precisionMode,
          limitRate: exchange.rateLimit,
          fees: exchange.fees
        };
        
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(info),
              contentType: "application/json"
            }
          ]
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: (error as Error).message }),
              contentType: "application/json"
            }
          ]
        };
      }
    }
  );
}
