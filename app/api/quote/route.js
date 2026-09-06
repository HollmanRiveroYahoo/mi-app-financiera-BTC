// app/api/quote/route.js - KRYPTO QUOTE API
import { NextResponse } from 'next/server';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC-USD';
  
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: FETCH_HEADERS, next: { revalidate: 30 } }
    );
    if (res.ok) {
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose || meta?.previousClose;
      
      if (typeof price === 'number') {
        const change = prevClose ? price - prevClose : 0;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        
        return NextResponse.json({ 
          symbol,
          price: price >= 1 ? price.toFixed(2) : price.toPrecision(4),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          currency: meta.currency || 'USD'
        });
      }
    }
    
    // Fallback hvis Yahoo mislykkes
    const fallbackPrice = symbol === 'BTC-USD' ? 79870.50 : 2492.00;
    return NextResponse.json({ 
      symbol,
      price: fallbackPrice.toFixed(2),
      change: '0.00',
      changePercent: '0.00',
      isFallback: true
    });
  } catch (error) {
    console.error('Error fetching crypto quote:', error);
    return NextResponse.json({ 
      symbol,
      price: (symbol === 'BTC-USD' ? 79870.50 : 100.00).toFixed(2),
      isFallback: true
    });
  }
}