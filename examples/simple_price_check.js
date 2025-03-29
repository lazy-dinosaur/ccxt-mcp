// Simple Price Check Example
// 이 예제는 CCXT MCP 서버를 통해 여러 거래소에서 비트코인 가격을 조회하는 방법을 보여줍니다.

import { MCPClient } from '@modelcontextprotocol/sdk';

// Claude에서 MCP를 사용하는 경우
// 이 코드는 Claude와 상호작용할 때 사용할 구문이므로 직접 실행하지 마세요
async function checkPricesInClaude() {
  // 비트코인 가격 조회하기
  const binanceTicker = await client.callTool({
    name: "fetchTicker",
    arguments: { exchangeId: "binance", symbol: "BTC/USDT" }
  });

  const coinbaseTicker = await client.callTool({
    name: "fetchTicker",
    arguments: { exchangeId: "coinbase", symbol: "BTC/USD" }
  });

  console.log(`비트코인 가격 (Binance): ${binanceTicker.last} USDT`);
  console.log(`비트코인 가격 (Coinbase): ${coinbaseTicker.last} USD`);
  
  // 거래소 간 가격 비교하기
  const priceDifference = ((coinbaseTicker.last - binanceTicker.last) / binanceTicker.last) * 100;
  console.log(`가격 차이: ${priceDifference.toFixed(2)}%`);
}

// 프로그래밍 방식으로 CCXT MCP 서버와 직접 상호작용하는 경우
// 이 코드는 Node.js 환경에서 직접 실행할 수 있습니다
async function checkPricesProgrammatically() {
  // CCXT MCP 서버에 연결
  const client = new MCPClient('http://localhost:3000');
  
  try {
    // 서버에 연결
    await client.connect();
    
    // 비트코인 가격 조회하기
    const binanceTicker = await client.callTool('fetchTicker', { 
      exchangeId: "binance", 
      symbol: "BTC/USDT" 
    });

    const coinbaseTicker = await client.callTool('fetchTicker', { 
      exchangeId: "coinbase", 
      symbol: "BTC/USD" 
    });

    console.log(`비트코인 가격 (Binance): ${binanceTicker.last} USDT`);
    console.log(`비트코인 가격 (Coinbase): ${coinbaseTicker.last} USD`);
    
    // 거래소 간 가격 비교하기
    const priceDifference = ((coinbaseTicker.last - binanceTicker.last) / binanceTicker.last) * 100;
    console.log(`가격 차이: ${priceDifference.toFixed(2)}%`);
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    // 연결 종료
    await client.disconnect();
  }
}

// 노드에서 실행하는 경우 이 코드를 주석 해제하세요
// checkPricesProgrammatically();
