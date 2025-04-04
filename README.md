# CCXT MCP Server

[![npm version](https://img.shields.io/npm/v/@lazydino/ccxt-mcp.svg)](https://www.npmjs.com/package/@lazydino/ccxt-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@lazydino/ccxt-mcp.svg)](https://www.npmjs.com/package/@lazydino/ccxt-mcp)
[![GitHub stars](https://img.shields.io/github/stars/lazy-dinosaur/ccxt-mcp.svg)](https://github.com/lazy-dinosaur/ccxt-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어 버전(Korean version)](README.ko.md)

CCXT MCP Server is a server that allows AI models to interact with cryptocurrency exchange APIs through the [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-cookbook/tree/main/model-context-protocol). This server uses the [CCXT library](https://github.com/ccxt/ccxt) to provide access to more than 100 cryptocurrency exchanges and their trading capabilities.

## 🚀 Quick Start

```bash
# Install the package globally
npm install -g @lazydino/ccxt-mcp

# Run with default settings
ccxt-mcp

# or run without installation
npx @lazydino/ccxt-mcp
```

## Installation and Usage

### Global Installation

```bash
# Install the package globally
npm install -g @lazydino/ccxt-mcp
```

### Running with npx

You can run it directly without installation:

```bash
# Using default settings
npx @lazydino/ccxt-mcp

# Using custom configuration file
npx @lazydino/ccxt-mcp --config /path/to/config.json
```

View help:

```bash
npx @lazydino/ccxt-mcp --help
```

## Configuration

### Registering the MCP Server in Claude Desktop

1. **Open Claude Desktop Settings**:

   - Go to the Settings menu in the Claude Desktop app
   - Find the "MCP Servers" section

2. **Add a New MCP Server**:

   - Click the "Add Server" button
   - Server name: `ccxt-mcp`
   - Command: `npx @lazydino/ccxt-mcp`
   - Additional arguments (optional): `--config /path/to/config.json`

3. **Save and Test the Server**:
   - Save the settings
   - Test the connection with the "Test Connection" button

### Configuration Methods - Two Options

#### Option 1: Include Account Information Directly in Claude Desktop Settings (Basic Method)

This method includes CCXT account information directly in the Claude Desktop settings file (claude_desktop_config.json):

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

Using this method, you don't need a separate configuration file. All settings are integrated into the Claude Desktop configuration file.

#### Option 2: Using a Separate Configuration File (Advanced Method)

To separate account information into a separate configuration file, set up as follows:

1. **Create a Separate Configuration File** (e.g., `ccxt-accounts.json`):

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

2. **Specify the Configuration File Path in Claude Desktop Settings**:

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

> **Reasons to Use a Separate Configuration File**:
>
> - Prevents recursive reference issues
> - Separates sensitive information like API keys
> - Easier multi-environment configuration (development, testing, production)
> - Improved configuration file version control

## Key Features

- **Market Information Retrieval**:

  - List exchanges
  - View market information by exchange
  - Get price information for specific symbols
  - View order book information for specific symbols
  - Search historical OHLCV data

- **Trading Functions**:

  - Create market/limit orders
  - Cancel orders and check status
  - View account balances
  - Check trading history

- **Trading Analysis**:

  - Daily/weekly/monthly performance analysis
  - Win rate calculation (last 7 days, 30 days, all time)
  - Average profit/loss ratio (R-multiple)
  - Maximum consecutive loss/profit series analysis
  - Asset variation tracking
  - Comprehensive performance metrics
  - Trade pattern recognition
  - Period-based return calculations

- **Position Management**:

  - Capital ratio trading (e.g., enter with 5% of account capital)
  - Futures market leverage setting (1-100x)
  - Dynamic position sizing (volatility-based)
  - Split buy/sell strategy implementation

- **Risk Management**:
  - Technical indicator-based stop loss setting (e.g., lowest point among 10 candles on 5-minute chart)
  - Volatility-based stop loss/take profit (ATR multiples)
  - Maximum allowable loss limit (daily/weekly)
  - Dynamic take profit setting (trailing profit)

## How It Works

```
User <--> AI Model(Claude/GPT) <--> MCP Protocol <--> CCXT MCP Server <--> Cryptocurrency Exchange API
```

1. **User**: Requests like "Tell me the Bitcoin price" or "Buy Ethereum on my Binance account"
2. **AI Model**: Understands user requests and determines which MCP tools/resources to use
3. **MCP Protocol**: Standardized communication between AI and CCXT MCP server
4. **CCXT MCP Server**: Communicates with cryptocurrency exchange APIs using the CCXT library
5. **Exchange API**: Provides actual data and executes trade orders

## Using with AI Models

When registered with Claude Desktop, you can make the following types of requests to AI models:

### Cautions and Recommended Prompts

When using AI models, consider the following cautions and use the prompt below for effective trading:

```
Your goal is to execute trades using the ccxt tools as much as possible
Cautions:
- Accurately identify whether it's a futures market or spot market before proceeding with trades
- If there's no instruction about percentage of capital or amount to use, always calculate and execute trades using the entire available capital
```

**Notes:**

- AI models sometimes confuse futures trading with spot trading.
- Without clear guidance on trading capital size, AI might get confused.
- Using the above prompt helps clearly communicate your trading intentions.

### Basic Query Examples

```
Check and compare the current Bitcoin price on binance and coinbase.
```

### Advanced Trading Query Examples

**Position Management**

```
Open a long position on BTC/USDT futures market in my Bybit account (bybit_futures) with 5% of capital using 10x leverage.
Enter based on moving average crossover strategy and set stop loss at the lowest point among the 12 most recent 5-minute candles.
```

**Performance Analysis**

```
Analyze my Binance account (bybit_main) trading records for the last 7 days and show me the win rate, average profit, and maximum consecutive losses.
```

**Detailed Trading Analytics**

```
Analyze my trading performance on the bybit_futures account for BTC/USDT over the last 30 days. Calculate win rate, profit factor, and identify any patterns in my winning trades.
```

```
Show me the monthly returns for my bybit_main account over the past 90 days and identify my best and worst trading months.
```

```
Analyze my consecutive wins and losses on my bybit_futures account and tell me if I have any psychological patterns affecting my trading after losses.
```

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/lazy-dinosaur/ccxt-mcp.git

# Navigate to project directory
cd ccxt-mcp

# Install dependencies
npm install

# Build
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

Distributed under the MIT License. See the LICENSE file for more information.

## ❤️ Support

If you find this project useful, please consider giving it a ⭐️ on GitHub!
