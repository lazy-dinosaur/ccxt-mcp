// Trading Example
// 이 예제는 CCXT MCP 서버를 통해 계정에 주문을 생성하는 방법을 보여줍니다.

import { MCPClient } from '@modelcontextprotocol/sdk';

// Claude에서 MCP를 사용하는 경우
// 이 코드는 Claude와 상호작용할 때 사용할 구문이므로 직접 실행하지 마세요
async function createOrderInClaude() {
  // 1. 계정 잔액 확인
  const balance = await client.callTool({
    name: "fetchBalance",
    arguments: { accountName: "bybit_main" }
  });
  
  console.log(`사용 가능한 USDT: ${balance.free.USDT}`);
  
  // 2. 현재 시세 확인
  const ticker = await client.callTool({
    name: "fetchTicker",
    arguments: { exchangeId: "bybit", symbol: "BTC/USDT" }
  });
  
  console.log(`현재 BTC 가격: ${ticker.last} USDT`);
  
  // 3. 거래 금액 계산 (전체 USDT의 5%)
  const tradingAmount = balance.free.USDT * 0.05;
  const btcAmount = tradingAmount / ticker.last;
  
  console.log(`구매할 BTC 양: ${btcAmount.toFixed(6)} BTC (약 ${tradingAmount.toFixed(2)} USDT)`);
  
  // 4. 시장가 매수 주문 생성
  const order = await client.callTool({
    name: "createOrder",
    arguments: {
      accountName: "bybit_main",
      symbol: "BTC/USDT",
      type: "market",
      side: "buy",
      amount: btcAmount
    }
  });
  
  console.log(`주문 생성 완료: ${order.id}`);
  console.log(`주문 상태: ${order.status}`);
  console.log(`체결 가격: ${order.price} USDT`);
}

// 프로그래밍 방식으로 CCXT MCP 서버와 직접 상호작용하는 경우
// 이 코드는 Node.js 환경에서 직접 실행할 수 있습니다
async function createOrderProgrammatically() {
  // CCXT MCP 서버에 연결
  const client = new MCPClient('http://localhost:3000');
  
  try {
    // 서버에 연결
    await client.connect();
    
    // 1. 계정 잔액 확인
    const balance = await client.callTool('fetchBalance', { 
      accountName: "bybit_main" 
    });
    
    console.log(`사용 가능한 USDT: ${balance.free.USDT}`);
    
    // 2. 현재 시세 확인
    const ticker = await client.callTool('fetchTicker', {
      exchangeId: "bybit", 
      symbol: "BTC/USDT"
    });
    
    console.log(`현재 BTC 가격: ${ticker.last} USDT`);
    
    // 3. 거래 금액 계산 (전체 USDT의 5%)
    const tradingAmount = balance.free.USDT * 0.05;
    const btcAmount = tradingAmount / ticker.last;
    
    console.log(`구매할 BTC 양: ${btcAmount.toFixed(6)} BTC (약 ${tradingAmount.toFixed(2)} USDT)`);
    
    // 4. 시장가 매수 주문 생성
    const order = await client.callTool('createOrder', {
      accountName: "bybit_main",
      symbol: "BTC/USDT",
      type: "market",
      side: "buy",
      amount: btcAmount
    });
    
    console.log(`주문 생성 완료: ${order.id}`);
    console.log(`주문 상태: ${order.status}`);
    console.log(`체결 가격: ${order.price} USDT`);
    
    // 5. 주문 상태 확인
    const orderStatus = await client.callTool('fetchOrder', {
      accountName: "bybit_main",
      symbol: "BTC/USDT",
      id: order.id
    });
    
    console.log(`주문 최종 상태: ${orderStatus.status}`);
    console.log(`체결 금액: ${orderStatus.cost} USDT`);
    console.log(`수수료: ${orderStatus.fee.cost} ${orderStatus.fee.currency}`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    // 연결 종료
    await client.disconnect();
  }
}

// 노드에서 실행하는 경우 이 코드를 주석 해제하세요
// createOrderProgrammatically();
