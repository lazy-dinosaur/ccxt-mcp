# CCXT MCP 시작하기

이 가이드는 CCXT MCP 서버를 설정하고 사용하는 기본적인 방법을 설명합니다.

## 설치

CCXT MCP는 npm을 통해 설치할 수 있습니다:

```bash
# 글로벌 설치
npm install -g @lazydino/ccxt-mcp

# 또는 프로젝트 내 설치
npm install @lazydino/ccxt-mcp
```

## 설정

### 1. 설정 파일 생성

`ccxt-accounts.json` 파일을 만들어 API 키 및 계정 정보를 저장합니다:

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

### 2. 서버 실행

```bash
# 기본 설정으로 실행
ccxt-mcp

# 또는 사용자 지정 설정 파일 사용
ccxt-mcp --config /path/to/ccxt-accounts.json
```

### 3. Claude Desktop에 등록

1. Claude Desktop 설정 메뉴 열기
2. MCP Servers 섹션 찾기
3. 새 서버 추가:
   - 서버 이름: `ccxt-mcp`
   - 명령어: `npx @lazydino/ccxt-mcp`
   - 추가 인수 (선택사항): `--config /path/to/ccxt-accounts.json`
4. 저장 및 연결 테스트

## 기본 사용법

### 시세 확인

```
비트코인 현재 가격을 binance와 coinbase에서 조회하고 비교해줘.
```

### 계정 조회

```
내 bybit_main 계정의 잔액을 보여줘.
```

### 주문 생성

```
내 bybit_main 계정에서 BTC/USDT 시장에 100 USDT 상당의 비트코인을 시장가로 구매해줘.
```

### 고급 기능 사용

```
내 bybit_futures 계정에서 BTC/USDT 선물 시장에 자본의 5%로 10배 레버리지를 사용해 롱 포지션을 열어줘.
최근 10개 5분봉 중 저점에 손절을 설정해.
```

## 주요 기능

### 시장 정보

- `fetchMarkets`: 거래소의 사용 가능한 시장 목록 조회
- `fetchTicker`: 특정 심볼의 최신 가격 정보 조회
- `fetchTickers`: 모든 심볼의 가격 정보 조회
- `fetchOrderBook`: 주문장 조회
- `fetchTrades`: 최근 거래 내역 조회
- `fetchOHLCV`: 캔들스틱(OHLCV) 데이터 조회

### 계정 및 거래

- `fetchBalance`: 계정 잔액 조회
- `createOrder`: 주문 생성
- `cancelOrder`: 주문 취소
- `fetchOrder`: 특정 주문 정보 조회
- `fetchOpenOrders`: 미체결 주문 조회
- `fetchClosedOrders`: 체결된 주문 조회
- `fetchMyTrades`: 내 거래 내역 조회

## 예제

더 많은 예제는 `examples` 디렉토리에서 찾을 수 있습니다:

- `simple_price_check.js`: 기본적인 가격 조회 예제
- `trading_example.js`: 거래 주문 생성 예제

## 문제 해결

### 일반적인 오류

- **연결 오류**: MCP 서버가 실행 중인지 확인하세요
- **인증 오류**: API 키와 시크릿이 올바르게 설정되었는지 확인하세요
- **주문 오류**: 충분한 잔액이 있는지, 주문 형식이 올바른지 확인하세요

### 로그 확인

문제 해결을 위해 서버 로그를 확인하세요:

```bash
ccxt-mcp --verbose
```
