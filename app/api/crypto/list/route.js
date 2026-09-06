// app/api/crypto/list/route.js - Henter alle kryptovalutaer fra Yahoo Finance Krypto-screener
import { NextResponse } from 'next/server';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

let cachedCryptoList = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutter hurtigbuffer

const FALLBACK_CRYPTOS = [
  { symbol: 'BTC-USD', name: 'Bitcoin USD', price: 79870.00, changePercent: 0.15, marketCap: 1600000000000, volume24h: 18500000000 },
  { symbol: 'ETH-USD', name: 'Ethereum USD', price: 2492.00, changePercent: -0.45, marketCap: 300000000000, volume24h: 12000000000 },
  { symbol: 'SOL-USD', name: 'Solana USD', price: 105.80, changePercent: 1.25, marketCap: 48000000000, volume24h: 3500000000 },
  { symbol: 'BNB-USD', name: 'BNB USD', price: 750.00, changePercent: 0.35, marketCap: 110000000000, volume24h: 1200000000 },
  { symbol: 'XRP-USD', name: 'XRP USD', price: 1.41, changePercent: -1.10, marketCap: 80000000000, volume24h: 2100000000 },
  { symbol: 'DOGE-USD', name: 'Dogecoin USD', price: 0.089, changePercent: 2.10, marketCap: 13000000000, volume24h: 950000000 },
  { symbol: 'ADA-USD', name: 'Cardano USD', price: 0.22, changePercent: -0.80, marketCap: 7800000000, volume24h: 410000000 },
  { symbol: 'AVAX-USD', name: 'Avalanche USD', price: 23.50, changePercent: 0.95, marketCap: 9500000000, volume24h: 380000000 },
  { symbol: 'LINK-USD', name: 'Chainlink USD', price: 12.37, changePercent: 1.50, marketCap: 7500000000, volume24h: 310000000 },
  { symbol: 'SUI20947-USD', name: 'Sui USD', price: 2.45, changePercent: 3.20, marketCap: 7000000000, volume24h: 890000000 },
  { symbol: 'NEAR-USD', name: 'NEAR Protocol USD', price: 4.10, changePercent: 0.85, marketCap: 4900000000, volume24h: 270000000 },
  { symbol: 'DOT-USD', name: 'Polkadot USD', price: 4.30, changePercent: -0.50, marketCap: 6100000000, volume24h: 210000000 },
  { symbol: 'BCH-USD', name: 'Bitcoin Cash USD', price: 256.20, changePercent: 0.40, marketCap: 5100000000, volume24h: 190000000 },
  { symbol: 'LTC-USD', name: 'Litecoin USD', price: 82.50, changePercent: -0.20, marketCap: 6200000000, volume24h: 320000000 },
  { symbol: 'SHIB-USD', name: 'Shiba Inu USD', price: 0.000014, changePercent: 1.15, marketCap: 8300000000, volume24h: 280000000 },
  { symbol: 'PEPE24478-USD', name: 'Pepe USD', price: 0.0000085, changePercent: 4.20, marketCap: 3600000000, volume24h: 650000000 },
  { symbol: 'UNI7083-USD', name: 'Uniswap USD', price: 7.80, changePercent: -1.20, marketCap: 4700000000, volume24h: 180000000 },
  { symbol: 'XMR-USD', name: 'Monero USD', price: 530.12, changePercent: 1.80, marketCap: 9700000000, volume24h: 150000000 },
  { symbol: 'XLM-USD', name: 'Stellar USD', price: 0.18, changePercent: 0.10, marketCap: 5400000000, volume24h: 160000000 },
  { symbol: 'APT21794-USD', name: 'Aptos USD', price: 6.20, changePercent: -2.10, marketCap: 3100000000, volume24h: 140000000 }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const count = parseInt(searchParams.get('count') || '100', 10);

    const now = Date.now();
    if (!forceRefresh && cachedCryptoList && (now - lastCacheTime < CACHE_DURATION_MS)) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        count: cachedCryptoList.length,
        lastUpdated: new Date(lastCacheTime).toISOString(),
        cryptos: cachedCryptoList
      });
    }

    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=all_cryptocurrencies_us&count=${count}`;
    const res = await fetch(yahooUrl, {
      headers: FETCH_HEADERS,
      next: { revalidate: 180 }
    });

    if (res.ok) {
      const data = await res.json();
      const quotes = data?.finance?.result?.[0]?.quotes || [];

      if (quotes.length > 0) {
        const formatted = quotes
          .filter(q => q.symbol && typeof q.regularMarketPrice === 'number')
          .map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol.replace('-USD', ''),
            price: q.regularMarketPrice,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            marketCap: q.marketCap || 0,
            volume24h: q.regularMarketVolume || q.vol_24hr || 0,
            high52w: q.fiftyTwoWeekHigh || null,
            low52w: q.fiftyTwoWeekLow || null,
            dayHigh: q.regularMarketDayHigh || null,
            dayLow: q.regularMarketDayLow || null,
            currency: q.currency || 'USD'
          }));

        // Sikre at BTC alltid er øverst dersom den er til stede
        formatted.sort((a, b) => {
          if (a.symbol === 'BTC-USD') return -1;
          if (b.symbol === 'BTC-USD') return 1;
          return (b.marketCap || 0) - (a.marketCap || 0);
        });

        cachedCryptoList = formatted;
        lastCacheTime = Date.now();

        return NextResponse.json({
          success: true,
          source: 'yahoo_finance_screener',
          count: formatted.length,
          lastUpdated: new Date(lastCacheTime).toISOString(),
          cryptos: formatted
        });
      }
    }

    // Fallback hvis Yahoo feilet eller var tom
    console.warn('Yahoo Finance screener ga tomt eller feilet resultat, bruker fallback.');
    return NextResponse.json({
      success: true,
      source: 'fallback',
      count: FALLBACK_CRYPTOS.length,
      lastUpdated: new Date().toISOString(),
      cryptos: FALLBACK_CRYPTOS
    });

  } catch (error) {
    console.error('Feil ved henting av krypto fra Yahoo:', error);
    return NextResponse.json({
      success: true,
      source: 'fallback_error',
      count: FALLBACK_CRYPTOS.length,
      lastUpdated: new Date().toISOString(),
      cryptos: FALLBACK_CRYPTOS
    });
  }
}
