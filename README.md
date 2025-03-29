# CCXT MCP - Cryptocurrency Exchange MCP Integration

CCXT MCP는 [Model Context Protocol (MCP)](https://modelcontextprotocol.io)을 통해 AI 모델이 암호화폐 거래소 API와 상호작용할 수 있도록 하는 서버입니다. [CCXT 라이브러리](https://github.com/ccxt/ccxt)를 내부적으로 활용하여 100개 이상의 암호화폐 거래소에 접근할 수 있게 해줍니다.

## 주요 기능

- **리소스 엔드포인트**:
  - 거래소 목록 조회
  - 거래소별 시장 정보 조회
  - 특정 심볼의 가격 정보 조회
  - 특정 심볼의 주문장 정보 조회

- **도구**:
  - 시장 정보 조회
  - 가격 정보 조회
  - 주문장 정보 조회
  - 거래 내역 조회
  - API 자격 증명 설정
  - 계정 잔액 조회
  - 주문 생성 및 취소

## 설치

```bash
# 패키지 설치
npm install ccxt-mcp

# 의존성 설치
npm install
```

## 사용법

### 서버 실행하기

```bash
# 개발 모드
npm run dev

# 빌드 후 실행
npm run build
npm start
```

### 클라이언트 코드 예시

다음은 [MCP 클라이언트](https://github.com/modelcontextprotocol/typescript-sdk)를 사용해 CCXT MCP 서버와 통신하는 예시입니다:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// MCP 클라이언트 생성
const transport = new StdioClientTransport({
  command: "node",
  args: ["./dist/index.js"]
});

const client = new Client(
  {
    name: "CCXT MCP Client",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {}
    }
  }
);

async function main() {
  // 서버에 연결
  await client.connect(transport);

  // 가능한 도구 목록 조회
  const tools = await client.listTools();
  console.log("Available tools:", tools);

  // 거래소 목록 리소스 읽기
  const exchanges = await client.readResource("exchanges://list");
  console.log("Available exchanges:", exchanges);

  // 특정 거래소의 시장 정보 조회
  const binanceMarkets = await client.readResource("markets://exchange/binance");
  console.log("Binance markets:", binanceMarkets);

  // 특정 심볼의 티커 정보 조회
  const btcUsdtTicker = await client.readResource("ticker://exchange/binance/BTC/USDT");
  console.log("BTC/USDT ticker:", btcUsdtTicker);

  // 도구를 사용하여 주문장 정보 조회
  const orderbook = await client.callTool({
    name: "fetchOrderBook",
    arguments: {
      exchangeId: "binance",
      symbol: "BTC/USDT",
      limit: 10
    }
  });
  console.log("BTC/USDT orderbook:", orderbook);

  // 연결 종료
  await client.close();
}

main().catch(console.error);
```

## AI 모델과 함께 사용하기

CCXT MCP는 AI 모델이 암호화폐 거래소 데이터에 액세스하고 거래 기능을 활용할 수 있도록 설계되었습니다. 예를 들어, Claude나 GPT와 같은 AI 모델에 다음과 같이 지시할 수 있습니다:

```
비트코인 현재 가격을 binance와 coinbase에서 조회하고 비교해줘.
```

AI는 MCP를 통해 다음과 같은 작업을 수행할 수 있습니다:
1. Binance와 Coinbase의 티커 리소스에 접근
2. "fetchTicker" 도구를 사용하여 BTC/USDT 가격 정보 조회
3. 두 거래소의 가격을 비교하고 결과 제공

## 확장 가능성

이 라이브러리는 다음과 같은 방향으로 확장할 수 있습니다:

1. **거래 전략 도구**: 이동 평균, RSI 등 기술적 분석 지표 추가
2. **포트폴리오 관리**: 다중 거래소 자산 관리 기능
3. **백테스팅**: 과거 데이터를 활용한 전략 테스트

## 기여하기

기여는 언제나 환영합니다! 풀 리퀘스트를 제출하기 전에 이슈를 먼저 생성하여 논의하는 것을 권장합니다.

## 라이선스

MIT 라이선스로 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.
