/**
 * 거래 분석 관련 도구들을 정의합니다.
 * 이 파일은 거래 성과 분석, 승률, 수익률 계산 등의 기능을 제공합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CcxtMcpServer } from "../server.js";

/**
 * 거래 분석 관련 도구들을 서버에 등록합니다.
 */
export function registerAnalysisTools(
  server: McpServer,
  ccxtServer: CcxtMcpServer
) {
  // 거래 성과 요약 분석 도구
  server.tool(
    "analyzeTradingPerformance",
    "Analyze trading performance for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      symbol: z
        .string()
        .optional()
        .describe("Optional trading symbol (e.g., 'BTC/USDT') to filter trades"),
      period: z
        .enum(["7d", "30d", "90d", "all"])
        .default("30d")
        .describe("Analysis period: '7d', '30d', '90d', or 'all'"),
    },
    async ({ accountName, symbol, period }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has["fetchMyTrades"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching personal trades for analysis`,
              },
            ],
            isError: true,
          };
        }

        // 기간에 따른 since 값 계산
        const now = Date.now();
        let since;
        switch (period) {
          case "7d":
            since = now - 7 * 24 * 60 * 60 * 1000; // 7일
            break;
          case "30d":
            since = now - 30 * 24 * 60 * 60 * 1000; // 30일
            break;
          case "90d":
            since = now - 90 * 24 * 60 * 60 * 1000; // 90일
            break;
          case "all":
            since = undefined; // 전체 데이터
            break;
        }

        // 거래 데이터 가져오기
        const trades = await exchange.fetchMyTrades(symbol, since, undefined);

        // 기본 분석 지표 계산
        const analysis = analyzeTradeData(trades, period);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing trading performance for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 승률 및 수익률 분석 도구
  server.tool(
    "calculateWinRate",
    "Calculate win rate and profit metrics for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      symbol: z
        .string()
        .optional()
        .describe("Optional trading symbol (e.g., 'BTC/USDT') to filter trades"),
      period: z
        .enum(["7d", "30d", "all"])
        .default("30d")
        .describe("Analysis period: '7d', '30d', or 'all'"),
    },
    async ({ accountName, symbol, period }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has["fetchMyTrades"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching personal trades for win rate calculation`,
              },
            ],
            isError: true,
          };
        }

        // 기간에 따른 since 값 계산
        const now = Date.now();
        let since;
        switch (period) {
          case "7d":
            since = now - 7 * 24 * 60 * 60 * 1000; // 7일
            break;
          case "30d":
            since = now - 30 * 24 * 60 * 60 * 1000; // 30일
            break;
          case "all":
            since = undefined; // 전체 데이터
            break;
        }

        // 거래 데이터 가져오기
        const trades = await exchange.fetchMyTrades(symbol, since, undefined);

        // 승률 및 수익률 계산
        const metrics = calculateWinRateAndProfitMetrics(trades);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error calculating win rate for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 최대 연속 손실/이익 분석 도구
  server.tool(
    "analyzeConsecutiveProfitLoss",
    "Analyze consecutive winning and losing trades",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      symbol: z
        .string()
        .optional()
        .describe("Optional trading symbol (e.g., 'BTC/USDT') to filter trades"),
      period: z
        .enum(["30d", "all"])
        .default("all")
        .describe("Analysis period: '30d' or 'all'"),
    },
    async ({ accountName, symbol, period }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has["fetchMyTrades"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching personal trades for consecutive analysis`,
              },
            ],
            isError: true,
          };
        }

        // 기간에 따른 since 값 계산
        const now = Date.now();
        let since;
        switch (period) {
          case "30d":
            since = now - 30 * 24 * 60 * 60 * 1000; // 30일
            break;
          case "all":
          default:
            since = undefined; // 전체 데이터
            break;
        }

        // 거래 내역 가져오기
        const trades = await exchange.fetchMyTrades(symbol, since, undefined);

        // 최대 연속 손실/이익 계산
        const analysis = analyzeConsecutiveTrades(trades);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing consecutive trades for account '${accountName}': ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 월간/일간 수익률 분석 도구
  server.tool(
    "analyzePeriodicReturns",
    "Analyze daily and monthly returns for a configured account",
    {
      accountName: z
        .string()
        .describe(
          "Account name defined in the configuration file (e.g., 'bybit_main')"
        ),
      symbol: z
        .string()
        .optional()
        .describe("Optional trading symbol (e.g., 'BTC/USDT') to filter trades"),
      period: z
        .enum(["30d", "90d", "180d", "1y"])
        .default("90d")
        .describe("Analysis period: '30d', '90d', '180d', or '1y'"),
      interval: z
        .enum(["daily", "weekly", "monthly"])
        .default("daily")
        .describe("Return calculation interval"),
    },
    async ({ accountName, symbol, period, interval }) => {
      try {
        const exchange = ccxtServer.getExchangeInstance(accountName);

        // fetchMyTrades 메서드가 지원되는지 확인
        if (!exchange.has["fetchMyTrades"]) {
          return {
            content: [
              {
                type: "text",
                text: `Account '${accountName}' (Exchange: ${exchange.id}) does not support fetching personal trades for periodic returns analysis`,
              },
            ],
            isError: true,
          };
        }

        // 기간에 따른 since 값 계산
        const now = Date.now();
        let since;
        switch (period) {
          case "30d":
            since = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case "90d":
            since = now - 90 * 24 * 60 * 60 * 1000;
            break;
          case "180d":
            since = now - 180 * 24 * 60 * 60 * 1000;
            break;
          case "1y":
            since = now - 365 * 24 * 60 * 60 * 1000;
            break;
        }

        // 거래 내역 가져오기
        const trades = await exchange.fetchMyTrades(symbol, since, undefined);

        // 기간별 수익률 계산
        const returns = calculatePeriodicReturns(trades, interval);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(returns, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing periodic returns for account '${accountName}': ${
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

/**
 * 거래 데이터를 분석하여 성과 지표를 계산합니다.
 */
function analyzeTradeData(trades: any[], period: string) {
  if (!trades || trades.length === 0) {
    return {
      period,
      totalTrades: 0,
      message: "No trades found for the specified period.",
    };
  }

  // 거래 데이터 정렬 (시간순)
  trades.sort((a, b) => a.timestamp - b.timestamp);

  // 기본 지표 계산
  let totalProfit = 0;
  let totalLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalFees = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalVolume = 0;

  // 거래별 분석
  trades.forEach((trade) => {
    // 수수료 계산
    const fee = trade.fee?.cost || 0;
    totalFees += fee;

    // 거래량 계산
    totalVolume += trade.amount * trade.price;

    // 손익 계산 (단순화된 버전 - 실제로는 포지션 추적 필요)
    const cost = trade.amount * trade.price;
    const profit = trade.side === "buy" ? -cost : cost; // 매우 단순화된 계산

    if (profit > 0) {
      totalProfit += profit;
      winCount++;
      largestWin = Math.max(largestWin, profit);
    } else if (profit < 0) {
      totalLoss += Math.abs(profit);
      lossCount++;
      largestLoss = Math.max(largestLoss, Math.abs(profit));
    }
  });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const netProfit = totalProfit - totalLoss - totalFees;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  // 거래 패턴 분석
  const firstTradeDate = new Date(trades[0].timestamp);
  const lastTradeDate = new Date(trades[trades.length - 1].timestamp);
  const tradingDurationDays = (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24);
  const tradesPerDay = tradingDurationDays > 0 ? totalTrades / tradingDurationDays : totalTrades;

  return {
    period,
    totalTrades,
    winCount,
    lossCount,
    winRate: winRate.toFixed(2) + "%",
    totalProfit: totalProfit.toFixed(8),
    totalLoss: totalLoss.toFixed(8),
    netProfit: netProfit.toFixed(8),
    totalFees: totalFees.toFixed(8),
    profitFactor: profitFactor.toFixed(2),
    largestWin: largestWin.toFixed(8),
    largestLoss: largestLoss.toFixed(8),
    totalVolume: totalVolume.toFixed(2),
    tradingPeriod: {
      firstTrade: firstTradeDate.toISOString(),
      lastTrade: lastTradeDate.toISOString(),
      durationDays: tradingDurationDays.toFixed(1),
      tradesPerDay: tradesPerDay.toFixed(1),
    }
  };
}

/**
 * 거래 데이터를 분석하여 승률과 수익률 지표를 계산합니다.
 */
function calculateWinRateAndProfitMetrics(trades: any[]) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      message: "No trades found for the specified period.",
    };
  }

  // 거래를 시간순으로 정렬
  trades.sort((a, b) => a.timestamp - b.timestamp);

  // 포지션별 거래 그룹화 (매우 단순화된 버전)
  // 실제로는 더 복잡한 포지션 추적 로직이 필요할 수 있음
  const positions: any[] = [];
  let currentPosition: any = null;

  trades.forEach((trade) => {
    if (!currentPosition) {
      currentPosition = {
        symbol: trade.symbol,
        side: trade.side,
        entryTime: trade.datetime,
        entryPrice: trade.price,
        amount: trade.amount,
        cost: trade.amount * trade.price,
        fees: trade.fee?.cost || 0,
        exitTime: null,
        exitPrice: null,
        profit: null,
      };
    } else if (currentPosition.side !== trade.side && currentPosition.symbol === trade.symbol) {
      // 반대 방향 거래는 포지션 종료로 간주
      currentPosition.exitTime = trade.datetime;
      currentPosition.exitPrice = trade.price;
      
      // 손익 계산 (매우 단순화된 버전)
      if (currentPosition.side === "buy") {
        // 매수 후 매도
        currentPosition.profit = (trade.price - currentPosition.entryPrice) * currentPosition.amount - currentPosition.fees - (trade.fee?.cost || 0);
      } else {
        // 매도 후 매수
        currentPosition.profit = (currentPosition.entryPrice - trade.price) * currentPosition.amount - currentPosition.fees - (trade.fee?.cost || 0);
      }
      
      positions.push(currentPosition);
      currentPosition = null;
    } else {
      // 같은 방향 거래는 포지션에 추가 (average down/up)
      const newAmount = currentPosition.amount + trade.amount;
      const newCost = currentPosition.cost + (trade.amount * trade.price);
      currentPosition.entryPrice = newCost / newAmount;
      currentPosition.amount = newAmount;
      currentPosition.cost = newCost;
      currentPosition.fees += trade.fee?.cost || 0;
    }
  });

  // 완료된 포지션만 분석
  const completedPositions = positions.filter(p => p.exitTime !== null);
  
  if (completedPositions.length === 0) {
    return {
      totalTrades: trades.length,
      completedPositions: 0,
      message: "No completed positions found for analysis.",
    };
  }

  // 기본 지표 계산
  let winCount = 0;
  let lossCount = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentConsecutiveWins = 0;
  let currentConsecutiveLosses = 0;
  
  completedPositions.forEach(position => {
    if (position.profit > 0) {
      winCount++;
      totalProfit += position.profit;
      currentConsecutiveWins++;
      currentConsecutiveLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentConsecutiveWins);
    } else {
      lossCount++;
      totalLoss += Math.abs(position.profit);
      currentConsecutiveLosses++;
      currentConsecutiveWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
    }
  });

  const totalPositions = completedPositions.length;
  const winRate = (winCount / totalPositions) * 100;
  const averageWin = winCount > 0 ? totalProfit / winCount : 0;
  const averageLoss = lossCount > 0 ? totalLoss / lossCount : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss);
  
  // R-multiple 계산 (평균 수익 / 평균 손실)
  const rMultiple = averageLoss > 0 ? averageWin / averageLoss : 0;

  return {
    totalTrades: trades.length,
    completedPositions: totalPositions,
    winCount,
    lossCount,
    winRate: winRate.toFixed(2) + "%",
    profitFactor: profitFactor.toFixed(2),
    netProfit: (totalProfit - totalLoss).toFixed(8),
    averageWin: averageWin.toFixed(8),
    averageLoss: averageLoss.toFixed(8),
    rMultiple: rMultiple.toFixed(2),
    expectancy: expectancy.toFixed(8),
    maxConsecutiveWins,
    maxConsecutiveLosses,
    firstTradeDate: completedPositions[0].entryTime,
    lastTradeDate: completedPositions[completedPositions.length - 1].exitTime,
  };
}

/**
 * 최대 연속 손실/이익 분석을 수행합니다.
 */
function analyzeConsecutiveTrades(trades: any[]) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      message: "No trades found for the specified period.",
    };
  }

  // 거래를 시간순으로 정렬
  trades.sort((a, b) => a.timestamp - b.timestamp);

  // 간단한 분석을 위해 거래를 승/패로 변환 (단순화된 버전)
  const tradeResults: boolean[] = [];
  let currentSide = null;
  let entryPrice = 0;

  trades.forEach((trade) => {
    if (currentSide === null) {
      // 첫 거래는 진입으로 간주
      currentSide = trade.side;
      entryPrice = trade.price;
    } else if (currentSide !== trade.side) {
      // 반대 방향 거래는 포지션 종료로 간주
      const isWin = (currentSide === 'buy' && trade.price > entryPrice) || 
                   (currentSide === 'sell' && trade.price < entryPrice);
      tradeResults.push(isWin);
      
      // 새로운 포지션 시작
      currentSide = trade.side;
      entryPrice = trade.price;
    }
  });

  // 연속 승/패 분석
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentConsecutiveWins = 0;
  let currentConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = { count: 0, startIndex: 0, endIndex: 0 };
  let maxLossStreak = { count: 0, startIndex: 0, endIndex: 0 };

  tradeResults.forEach((isWin, index) => {
    if (isWin) {
      currentConsecutiveWins++;
      currentConsecutiveLosses = 0;
      
      if (currentWinStreak === 0) {
        currentWinStreak = 1;
        currentLossStreak = 0;
      } else {
        currentWinStreak++;
      }
      
      if (currentWinStreak > maxWinStreak.count) {
        maxWinStreak = {
          count: currentWinStreak,
          startIndex: index - currentWinStreak + 1,
          endIndex: index
        };
      }
    } else {
      currentConsecutiveLosses++;
      currentConsecutiveWins = 0;
      
      if (currentLossStreak === 0) {
        currentLossStreak = 1;
        currentWinStreak = 0;
      } else {
        currentLossStreak++;
      }
      
      if (currentLossStreak > maxLossStreak.count) {
        maxLossStreak = {
          count: currentLossStreak,
          startIndex: index - currentLossStreak + 1,
          endIndex: index
        };
      }
    }

    maxConsecutiveWins = Math.max(maxConsecutiveWins, currentConsecutiveWins);
    maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
  });

  // 최대 연속 승/패 시 총 손익 계산
  const maxWinStreakTrades = maxWinStreak.count > 0 
    ? tradeResults.slice(maxWinStreak.startIndex, maxWinStreak.endIndex + 1) 
    : [];
    
  const maxLossStreakTrades = maxLossStreak.count > 0 
    ? tradeResults.slice(maxLossStreak.startIndex, maxLossStreak.endIndex + 1) 
    : [];

  return {
    totalCompletedTrades: tradeResults.length,
    winCount: tradeResults.filter(result => result).length,
    lossCount: tradeResults.filter(result => !result).length,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    maxWinStreak: {
      count: maxWinStreak.count,
      startDate: maxWinStreak.count > 0 ? trades[maxWinStreak.startIndex].datetime : null,
      endDate: maxWinStreak.count > 0 ? trades[maxWinStreak.endIndex].datetime : null,
    },
    maxLossStreak: {
      count: maxLossStreak.count,
      startDate: maxLossStreak.count > 0 ? trades[maxLossStreak.startIndex].datetime : null,
      endDate: maxLossStreak.count > 0 ? trades[maxLossStreak.endIndex].datetime : null,
    },
    currentStreakType: currentConsecutiveWins > 0 ? "win" : "loss",
    currentStreakCount: Math.max(currentConsecutiveWins, currentConsecutiveLosses),
  };
}

/**
 * 일간/주간/월간 수익률을 계산합니다.
 */
function calculatePeriodicReturns(trades: any[], interval: string) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      message: "No trades found for the specified period.",
    };
  }

  // 거래를 시간순으로 정렬
  trades.sort((a, b) => a.timestamp - b.timestamp);

  // 기간별로 그룹화
  const periodicData: Record<string, { profit: number, trades: number }> = {};
  
  trades.forEach(trade => {
    const date = new Date(trade.timestamp);
    let key: string;
    
    switch(interval) {
      case 'weekly':
        // 주차 계산 (ISO 주 - 1부터 53까지)
        const weekOfYear = getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekOfYear}`;
        break;
      case 'monthly':
        // 월 (1월은 0)
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'daily':
      default:
        // 일 (YYYY-MM-DD)
        key = date.toISOString().split('T')[0];
    }
    
    if (!periodicData[key]) {
      periodicData[key] = { profit: 0, trades: 0 };
    }
    
    // 단순화된 손익 계산
    const profit = trade.side === 'buy' 
      ? -(trade.amount * trade.price) 
      : (trade.amount * trade.price);
    
    periodicData[key].profit += profit - (trade.fee?.cost || 0);
    periodicData[key].trades++;
  });

  // 결과 처리
  const returns = Object.entries(periodicData).map(([period, data]) => ({
    period,
    profit: data.profit.toFixed(8),
    trades: data.trades
  })).sort((a, b) => a.period.localeCompare(b.period));
  
  // 통계 계산
  const profitValues = returns.map(r => parseFloat(r.profit));
  const totalProfit = profitValues.reduce((sum, profit) => sum + profit, 0);
  const averagePeriodProfit = profitValues.length > 0 
    ? totalProfit / profitValues.length 
    : 0;
  
  const positiveReturns = profitValues.filter(p => p > 0);
  const negativeReturns = profitValues.filter(p => p < 0);
  
  return {
    interval,
    totalPeriods: returns.length,
    totalProfit: totalProfit.toFixed(8),
    averagePeriodProfit: averagePeriodProfit.toFixed(8),
    profitablePeriods: positiveReturns.length,
    lossPeriods: negativeReturns.length,
    profitablePeriodRatio: returns.length > 0 
      ? ((positiveReturns.length / returns.length) * 100).toFixed(2) + '%' 
      : '0%',
    bestPeriod: profitValues.length > 0 
      ? returns[profitValues.indexOf(Math.max(...profitValues))] 
      : null,
    worstPeriod: profitValues.length > 0 
      ? returns[profitValues.indexOf(Math.min(...profitValues))] 
      : null,
    periodicReturns: returns
  };
}

/**
 * 날짜의 ISO 주(week) 번호를 계산합니다.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}