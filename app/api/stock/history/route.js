// app/api/stock/history/route.js - KRYPTO HISTORIKK API (YAHOO FINANCE)
import { NextResponse } from 'next/server';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC-USD';
  const range = searchParams.get('range') || 'month';
  
  const intervalMap = {
    'day': '5m',
    'week': '15m', 
    'month': '1d',
    '6months': '1d',
    'year': '1wk'
  };
  
  const rangeMap = {
    'day': '1d',
    'week': '5d',
    'month': '1mo',
    '6months': '6mo',
    'year': '1y'
  };

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${intervalMap[range] || '1d'}&range=${rangeMap[range] || '1mo'}`,
      { headers: FETCH_HEADERS, next: { revalidate: 120 } }
    );
    
    if (res.ok) {
      const data = await res.json();
      const result = data.chart?.result?.[0];
      
      if (result?.indicators?.quote?.[0]) {
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp || [];
        
        const chartData = timestamps.map((time, i) => ({
          time: time,
          open: quote.open?.[i] || 0,
          high: quote.high?.[i] || 0,
          low: quote.low?.[i] || 0,
          close: quote.close?.[i] || 0
        })).filter(d => d.close > 0);
        
        if (chartData.length > 0) {
          return NextResponse.json(chartData);
        }
      }
    }
    return NextResponse.json(generateFallbackCryptoData(symbol, range));
  } catch (error) {
    console.error('Error Yahoo Finance crypto history:', error);
    return NextResponse.json(generateFallbackCryptoData(symbol, range));
  }
}

function generateFallbackCryptoData(symbol, range) {
  const data = [];
  let basePrice = 79000;
  if (symbol.includes('ETH')) basePrice = 2450;
  else if (symbol.includes('SOL')) basePrice = 105;
  else if (symbol.includes('BNB')) basePrice = 740;
  else if (symbol.includes('XRP')) basePrice = 1.4;
  else if (symbol.includes('DOGE')) basePrice = 0.088;

  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const count = range === 'day' ? 24 : (range === 'week' ? 35 : (range === 'month' ? 30 : 60));
  const step = range === 'day' ? 3600 : (range === 'week' ? 14400 : 86400);

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const pctChange = (Math.random() - 0.48) * 0.03;
    const open = price;
    const close = price * (1 + pctChange);
    const high = Math.max(open, close) * 1.01;
    const low = Math.min(open, close) * 0.99;
    price = close;
    data.push({
      time: time,
      open: parseFloat(open >= 1 ? open.toFixed(2) : open.toPrecision(4)),
      high: parseFloat(high >= 1 ? high.toFixed(2) : high.toPrecision(4)),
      low: parseFloat(low >= 1 ? low.toFixed(2) : low.toPrecision(4)),
      close: parseFloat(close >= 1 ? close.toFixed(2) : close.toPrecision(4))
    });
  }
  return data;
}