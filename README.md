# CCXT MCP Server

CCXT MCP 서버는 [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-cookbook/tree/main/model-context-protocol)을 통해 AI 모델이 암호화폐 거래소 API와 상호작용할 수 있도록 하는 서버입니다. 이 서버는 [CCXT 라이브러리](https://github.com/ccxt/ccxt)를 사용하여 100개 이상의 암호화폐 거래소에 접근하고 거래할 수 있는 기능을 제공합니다.

## 설치 및 사용법

### 글로벌 설치

```bash
# 패키지 전역 설치
npm install -g @lazy-dinosaur/ccxt-mcp
```

### npx로 실행하기

설치 없이 바로 실행할 수 있습니다:

```bash
# 기본 설정 사용
npx @lazy-dinosaur/ccxt-mcp

# 사용자 지정 설정 파일 사용
npx @lazy-dinosaur/ccxt-mcp --config /path/to/config.json
```

도움말 보기:
```bash
npx @lazy-dinosaur/ccxt-mcp --help
```

## 설정 방법

### Claude Desktop에서 MCP 서버 등록하기

1. **Claude Desktop 설정 열기**:
   - Claude Desktop 앱의 설정(Settings) 메뉴로 이동
   - "MCP Servers" 섹션 찾기

2. **새 MCP 서버 추가**:
   - "Add Server" 버튼 클릭
   - 서버 이름: `ccxt-mcp`
   - 명령어: `npx @lazy-dinosaur/ccxt-mcp` 
   - 추가 인수(선택 사항): `--config /path/to/config.json`

3. **서버 저장 및 테스트**:
   - 설정 저장
   - "Test Connection" 버튼으로 연결 테스트

### 설정 파일

설정 파일은 다음과 같은 형식으로 구성됩니다:

```json
{
  "accounts": [
    {
      "name": "bybit_main",
      "exchangeId": "bybit",
      "apiKey": "YOUR_API_KEY",
      "secret": "YOUR_SECRET_KEY",
      "defaultType": "spot"
    },
    {
      "name": "bybit_futures",
      "exchangeId": "bybit",
      "apiKey": "YOUR_API_KEY",
      "secret": "YOUR_SECRET_KEY",
      "defaultType": "swap"
    }
  ]
}
```

> **참고**: 별도의 설정 파일을 사용하면 Claude Desktop 구성 파일과의 재귀 참조 문제를 방지할 수 있습니다. Claude Desktop의 설정에 다음과 같이 MCP 서버를 등록하세요:
>
> ```json
> "ccxt-mcp": {
>   "command": "npx",
>   "args": ["@lazy-dinosaur/ccxt-mcp", "--config", "/path/to/config.json"]
> }
> ```

## 주요 기능

- **시장 정보 조회**:
  - 거래소 목록 조회
  - 거래소별 시장 정보 조회
  - 특정 심볼의 가격 정보 조회
  - 특정 심볼의 주문장 정보 조회
  - 과거 OHLCV 데이터 검색

- **거래 기능**:
  - 시장가/지정가 주문 생성
  - 주문 취소 및 상태 조회
  - 계정 잔액 조회
  - 거래 내역 조회

- **트레이딩 분석**:
  - 일/주/월 단위 성과 분석
  - 승률 계산 (최근 7일, 30일, 전체 기간)
  - 평균 수익/손실 비율 (R-multiple)
  - 최대 연속 손실/이익 시리즈 분석
  - 자산 변동 추적

- **포지션 관리**:
  - 자본 대비 비율 매매 (예: 계정 자본의 5% 진입)
  - 선물 시장 레버리지 설정 (1-100x)
  - 동적 포지션 사이징 (변동성 기반)
  - 분할 매수/매도 전략 구현

- **리스크 관리**:
  - 기술적 지표 기반 손절매 설정 (예: 5분봉 기준 10개 캔들 중 저점)
  - 변동성 기반 손절매/익절매 (ATR 배수)
  - 최대 허용 손실 제한 (일별/주별)
  - 동적 익절매 설정 (추종형 이익 확정)

## 작동 방식

```
사용자 <--> AI 모델(Claude/GPT) <--> MCP 프로토콜 <--> CCXT MCP 서버 <--> 암호화폐 거래소 API
```

1. **사용자**: "비트코인 가격을 알려줘" 또는 "내 바이낸스 계정에서 이더리움 구매해줘"와 같은 요청
2. **AI 모델**: 사용자 요청을 이해하고 어떤 MCP 도구/리소스를 사용할지 결정
3. **MCP 프로토콜**: AI와 CCXT MCP 서버 간의 표준화된 통신
4. **CCXT MCP 서버**: CCXT 라이브러리를 사용하여 암호화폐 거래소 API와 통신
5. **거래소 API**: 실제 데이터 제공 및 거래 주문 실행

## AI 모델과 함께 사용하기

Claude Desktop에 등록하면 AI 모델에게 다음과 같은 요청을 할 수 있습니다:

### 기본 쿼리 예시

```
비트코인 현재 가격을 binance와 coinbase에서 조회하고 비교해줘.
```

### 고급 트레이딩 쿼리 예시

**포지션 관리**
```
내 Bybit 계정(bybit_futures)에서 BTC/USDT 선물 시장에 자본의 5%로 10배 레버리지를 사용해 롱 포지션을 열어줘. 
이동평균선 교차 전략을 기반으로 진입하고, 최근 12개 5분봉 중 저점에 손절을 설정해.
```

**성과 분석**
```
지난 7일간의 내 Binance 계정(bybit_main) 거래 기록을 분석해서 승률, 평균 수익률, 최대 연속 손실을 보여줘.
```

## 고급 사용법 예시

다음은 CCXT MCP를 활용한 고급 트레이딩 기능 구현 예시입니다:

### 포지션 자본 비율 및 레버리지 설정

```javascript
// 계정 자본의 5%로 10배 레버리지 롱 포지션 진입
async function enterPositionWithCapitalRatio(client, accountName, symbol, capitalPercentage, leverage) {
  // 계정 잔액 조회
  const balance = await client.callTool({
    name: "fetchBalance",
    arguments: { accountName }
  });
  
  // 사용 가능한 USDT 가져오기
  const availableCapital = balance.free.USDT || 0;
  
  // 진입 금액 계산 (자본의 5%)
  const entryCapital = availableCapital * (capitalPercentage / 100);
  
  // 현재 시장 가격 가져오기
  const ticker = await client.callTool({
    name: "fetchTicker",
    arguments: { exchangeId: "bybit", symbol }
  });
  
  // 거래량 계산
  const entryPrice = ticker.last;
  const amount = entryCapital / entryPrice;
  
  // 레버리지 설정 (거래소별 구현 필요)
  await setupLeverage(client, accountName, symbol, leverage);
  
  // 주문 생성 (선물 시장)
  return client.callTool({
    name: "createOrder",
    arguments: {
      accountName,
      symbol,
      type: "market",
      side: "buy",
      amount,
      params: {
        leverage: leverage,
        marginMode: "cross"
      }
    }
  });
}
```

### 캔들 기반 손절 설정

```javascript
// N개 캔들 중 저점 기준 손절 설정
async function setStopLossBasedOnCandles(client, accountName, symbol, timeframe, candles) {
  // 최근 캔들 데이터 가져오기
  const ohlcv = await client.callTool({
    name: "fetchOHLCV",
    arguments: {
      exchangeId: accountName.split('-')[0],
      symbol,
      timeframe,
      limit: candles
    }
  });
  
  // 저점 찾기
  const lows = ohlcv.map(candle => candle[3]); // 저가 (Low)
  const lowestPrice = Math.min(...lows);
  
  // 오픈 포지션 찾기
  const positions = await client.callTool({
    name: "fetchPositions",
    arguments: { accountName, symbol }
  });
  
  if (positions.length === 0) {
    throw new Error("No open positions found");
  }
  
  const position = positions[0];
  
  // 손절 주문 생성
  return client.callTool({
    name: "createOrder",
    arguments: {
      accountName,
      symbol,
      type: "stop",
      side: position.side === "long" ? "sell" : "buy",
      amount: position.amount,
      price: lowestPrice * 0.995, // 약간의 슬리피지 추가
      params: {
        stopPrice: lowestPrice,
        reduceOnly: true
      }
    }
  });
}
```

## 개발

### 소스에서 빌드하기

```bash
# 저장소 클론
git clone https://github.com/lazy-dinosaur/ccxt-mcp.git

# 프로젝트 디렉토리로 이동
cd ccxt-mcp

# 의존성 설치
npm install

# 빌드
npm run build
```

## 라이센스

MIT 라이센스로 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.
