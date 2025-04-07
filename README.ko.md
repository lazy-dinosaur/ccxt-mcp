# CCXT MCP Server

[![npm version](https://img.shields.io/npm/v/@lazydino/ccxt-mcp.svg)](https://www.npmjs.com/package/@lazydino/ccxt-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@lazydino/ccxt-mcp.svg)](https://www.npmjs.com/package/@lazydino/ccxt-mcp)
[![GitHub stars](https://img.shields.io/github/stars/lazy-dinosaur/ccxt-mcp.svg)](https://github.com/lazy-dinosaur/ccxt-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English version(영어 버전)](README.md)

CCXT MCP 서버는 [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-cookbook/tree/main/model-context-protocol)을 통해 AI 모델이 암호화폐 거래소 API와 상호작용할 수 있도록 하는 서버입니다. 이 서버는 [CCXT 라이브러리](https://github.com/ccxt/ccxt)를 사용하여 100개 이상의 암호화폐 거래소에 접근하고 거래할 수 있는 기능을 제공합니다.

## 🚀 빠른 시작

```bash
# 패키지 전역 설치
npm install -g @lazydino/ccxt-mcp

# 기본 설정으로 실행
ccxt-mcp

# 또는 설치 없이 실행
npx @lazydino/ccxt-mcp
```

## 설치 및 사용법

### 글로벌 설치

```bash
# 패키지 전역 설치
npm install -g @lazydino/ccxt-mcp
```

### npx로 실행하기

설치 없이 바로 실행할 수 있습니다:

```bash
# 기본 설정 사용
npx @lazydino/ccxt-mcp

# 사용자 지정 설정 파일 사용
npx @lazydino/ccxt-mcp --config /path/to/config.json
```

도움말 보기:

```bash
npx @lazydino/ccxt-mcp --help
```

## 설정 방법

### Claude Desktop에서 MCP 서버 등록하기

1. **Claude Desktop 설정 열기**:

   - Claude Desktop 앱의 설정(Settings) 메뉴로 이동
   - "MCP Servers" 섹션 찾기

2. **새 MCP 서버 추가**:

   - "Add Server" 버튼 클릭
   - 서버 이름: `ccxt-mcp`
   - 명령어: `npx @lazydino/ccxt-mcp`
   - 추가 인수(선택 사항): `--config /path/to/config.json`

3. **서버 저장 및 테스트**:
   - 설정 저장
   - "Test Connection" 버튼으로 연결 테스트

### 설정 방법 - 두 가지 옵션

#### 옵션 1: Claude Desktop 설정 파일 내에 직접 계정 정보 포함 (기본 방식)

이 방식은 Claude Desktop 설정 파일(claude_desktop_config.json) 내에 직접 CCXT 계정 정보를 포함합니다:

```json
{
  "mcpServers": {
    "ccxt-mcp": {
      "command": "npx",
      "args": ["-y", "@lazydino/ccxt-mcp"],
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
  }
}
```

이 방식을 사용하면 별도의 설정 파일이 필요하지 않습니다. 모든 설정이 Claude Desktop 구성 파일에 통합됩니다.

#### 옵션 2: 별도 설정 파일 사용 (고급 방식)

계정 정보를 별도의 설정 파일로 분리하려면 다음과 같이 구성하세요:

1. **별도 설정 파일 생성** (예: `ccxt-accounts.json`):

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

> **중요**: 설정 파일은 위와 같이 루트 수준에 `accounts` 배열을 포함해야 합니다.

2. **Claude Desktop 설정에서 설정 파일 경로 지정**:

```json
{
  "mcpServers": {
    "ccxt-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@lazydino/ccxt-mcp",
        "--config",
        "/path/to/ccxt-accounts.json"
      ]
    }
  }
}
```

> **참고**: `--config` 옵션으로 별도 설정 파일을 사용할 때, 서버는 `mcpServers.ccxt-mcp.accounts` 경로가 아닌 JSON 파일의 루트에서 직접 `accounts` 배열을 찾습니다.

3. **명령줄에서 외부 설정 파일 사용하기**:

```bash
# 사용자 지정 설정 파일 사용
npx @lazydino/ccxt-mcp --config /path/to/ccxt-accounts.json
```

저장소의 `examples/config-example.json`에서 예제 설정 파일을 찾을 수 있습니다.

> **별도 설정 파일을 사용하는 이유**:
>
> - 재귀 참조 문제 방지
> - API 키와 같은 민감한 정보 분리
> - 다중 환경 설정 용이(개발, 테스트, 프로덕션)
> - 설정 파일 버전 관리 개선

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
  - 종합적인 성과 지표 분석
  - 거래 패턴 인식
  - 기간별 수익률 계산

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

### 주의사항 및 추천 프롬프트

AI 모델을 사용할 때 다음 주의사항을 고려하고, 효과적인 거래를 위해 아래와 같은 프롬프트를 사용하는 것이 좋습니다:

```
ccxt 툴을 최대한 이용해서 매매를 실행하는게 너의 목표야
주의사항
- 선물 시장인지 현물 시장인지 정확하게 파악하고 매매 진행
- 만약 자본의 몇프로 혹은 얼마 라는 지침이 없다면 무조건 사용가능한 전체 자본을 사용해서 계산해서 매매를 진행해
```

**참고 사항:**

- AI 모델은 종종 선물 매매와 현물 매매를 혼동할 수 있습니다.
- 거래 자본 규모에 대한 명확한 지침 없이는 AI가 혼란을 겪을 수 있습니다.
- 위의 프롬프트를 사용하면 거래 의도를 명확히 전달하는 데 도움이 됩니다.

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

**상세 거래 분석**

```
지난 30일간 내 bybit_futures 계정의 BTC/USDT 거래 성과를 분석해줘. 승률, 수익 요소, 그리고 내 성공적인 거래들의 패턴을 파악해줘.
```

```
지난 90일간 내 bybit_main 계정의 월별 수익률을 보여주고, 가장 좋았던 달과 가장 나빴던 달을 알려줘.
```

```
내 bybit_futures 계정의 연속적인 성공과 실패를 분석하고, 손실 후에 내 심리적 패턴이 거래에 영향을 미치는지 알려줘.
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

## 🤝 기여하기

기여는 언제나 환영합니다! Pull Request를 자유롭게 제출해 주세요.

## 📄 라이센스

MIT 라이센스로 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## ❤️ 지원하기

이 프로젝트가 유용하다고 생각하시면, GitHub에 ⭐️을 눌러주세요!
