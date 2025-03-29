# CCXT MCP Server

[한국어 버전(Korean version)](README.ko.md)

CCXT MCP Server is a server that allows AI models to interact with cryptocurrency exchange APIs through the [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-cookbook/tree/main/model-context-protocol). This server uses the [CCXT library](https://github.com/ccxt/ccxt) to provide access to more than 100 cryptocurrency exchanges and their trading capabilities.

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

## Advanced Usage Examples

Here are examples of advanced trading features implemented using CCXT MCP:

### Position Capital Ratio and Leverage Setting

```javascript
// Enter a long position with 5% of account capital and 10x leverage
async function enterPositionWithCapitalRatio(
  client,
  accountName,
  symbol,
  capitalPercentage,
  leverage,
) {
  // Check account balance
  const balance = await client.callTool({
    name: "fetchBalance",
    arguments: { accountName },
  });

  // Get available USDT
  const availableCapital = balance.free.USDT || 0;

  // Calculate entry amount (5% of capital)
  const entryCapital = availableCapital * (capitalPercentage / 100);

  // Get current market price
  const ticker = await client.callTool({
    name: "fetchTicker",
    arguments: { exchangeId: "bybit", symbol },
  });

  // Calculate volume
  const entryPrice = ticker.last;
  const amount = entryCapital / entryPrice;

  // Set leverage (needs exchange-specific implementation)
  await setupLeverage(client, accountName, symbol, leverage);

  // Create order (futures market)
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
        marginMode: "cross",
      },
    },
  });
}
```

### Candle-Based Stop Loss Setting

```javascript
// Set stop loss based on the lowest point among N candles
async function setStopLossBasedOnCandles(
  client,
  accountName,
  symbol,
  timeframe,
  candles,
) {
  // Get recent candle data
  const ohlcv = await client.callTool({
    name: "fetchOHLCV",
    arguments: {
      exchangeId: accountName.split("-")[0],
      symbol,
      timeframe,
      limit: candles,
    },
  });

  // Find the lowest point
  const lows = ohlcv.map((candle) => candle[3]); // Low price
  const lowestPrice = Math.min(...lows);

  // Find open positions
  const positions = await client.callTool({
    name: "fetchPositions",
    arguments: { accountName, symbol },
  });

  if (positions.length === 0) {
    throw new Error("No open positions found");
  }

  const position = positions[0];

  // Create stop loss order
  return client.callTool({
    name: "createOrder",
    arguments: {
      accountName,
      symbol,
      type: "stop",
      side: position.side === "long" ? "sell" : "buy",
      amount: position.amount,
      price: lowestPrice * 0.995, // Add a small slippage
      params: {
        stopPrice: lowestPrice,
        reduceOnly: true,
      },
    },
  });
}
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

## License

Distributed under the MIT License. See the LICENSE file for more information.
