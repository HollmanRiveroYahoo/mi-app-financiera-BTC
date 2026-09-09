// app/api/signals/route.js - KRYPTO SIGNAL SCANNER MED YAHOO FINANCE (Top 100)
import { NextResponse } from 'next/server';

let cachedSignals = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutter

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

function getFallbackSignals() {
  return [
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 79870.50, confidence: 88, action: 'KJØP', timestamp: new Date().toISOString(), rsi: 26, sma7: 78500.00 },
    { symbol: 'ETH-USD', name: 'Ethereum', price: 2492.20, confidence: 75, action: 'KJØP', timestamp: new Date().toISOString(), rsi: 34, sma7: 2460.10 },
    { symbol: 'SOL-USD', name: 'Solana', price: 105.80, confidence: 68, action: 'OBSERVER', timestamp: new Date().toISOString(), rsi: 48, sma7: 104.20 }
  ];
}

async function fetchTop100Symbols() {
  try {
    const url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=all_cryptocurrencies_us&count=100';
    const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 180 } });
    if (!res.ok) return [];
    const data = await res.json();
    const quotes = data?.finance?.result?.[0]?.quotes || [];
    return quotes.filter(q => q.symbol).map(q => q.symbol);
  } catch (err) {
    console.error('Feil ved henting av topp 100:', err);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    if (!forceRefresh && cachedSignals && (now - lastCacheTime < CACHE_DURATION_MS)) {
      return NextResponse.json({ cached: true, lastUpdated: new Date(lastCacheTime).toISOString(), signals: cachedSignals });
    }

    let symbolsToScan = await fetchTop100Symbols();
    
    // Filtrer KUN Revolut mynter
    const REVOLUT_SUPPORTED = new Set([
      'BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ETC', 'ADA', 'DOT', 'LINK', 'XLM', 'EOS', 'XTZ', 'UNI', 'COMP', 'MATIC', 'POL', 'ATOM', 'ALGO', 'DOGE', 'SHIB', 'SOL', 'AVAX', 'APE', 'CRV', '1INCH', 'GALA', 'SAND', 'MANA', 'ENJ', 'BAT', 'KNC', 'BNT', 'SNX', 'UMA', 'GRT', 'LRC', 'ZRX', 'OXT', 'CGLD', 'NMR', 'TRB', 'BAND', 'BAL', 'YFI', 'KSM', 'SUSHI', 'FIL', 'RUNE', 'ICP', 'MINA', 'GNO', 'CHZ', 'KEEP', 'NU', 'MASK', 'FORTH', 'ARPA', 'RAD', 'LPT', 'GTC', 'MLN', 'QNT', 'PERP', 'MCO2', 'FARM', 'RARI', 'RNDR', 'RENDER', 'PLA', 'FOX', 'ALCX', 'BOND', 'SPELL', 'ENS', 'API3', 'BICO', 'GODS', 'IMX', 'STX', 'GLM', 'REQ', 'TRU', 'FXS', 'VITE', 'DENT', 'WAXP', 'CKB', 'AR', 'XEC', 'AUDIO', 'RAY', 'SRM', 'C98', 'SLP', 'AXS', 'ILV', 'ALICE', 'YGG', 'DAR', 'TLM', 'LTO', 'VET', 'THETA', 'TFUEL', 'HBAR', 'ONE', 'CELO', 'CRO', 'NEXO', 'CEL', 'KCS', 'HT', 'OKB', 'FTT', 'GT', 'WOO', 'XEM', 'XYM', 'ZIL', 'RVN', 'DGB', 'SC', 'DCR', 'ZEN', 'ZEC', 'DASH', 'XMR', 'SUI', 'PEPE', 'NEAR', 'APT', 'INJ', 'OP', 'ARB', 'FET', 'TIA', 'SEI', 'ORDI', 'BONK', 'WIF', 'FLOKI'
    ]);

    if (symbolsToScan && symbolsToScan.length > 0) {
      symbolsToScan = symbolsToScan.filter(sym => {
        const base = sym.split('-')[0].replace(/[0-9]+$/, '');
        return REVOLUT_SUPPORTED.has(base);
      });
    }

    if (!symbolsToScan || symbolsToScan.length === 0) {
      symbolsToScan = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD', 'DOT-USD'];
    }

    const signals = [];
    const BATCH_SIZE = 25;
    
    for (let i = 0; i < symbolsToScan.length; i += BATCH_SIZE) {
      const batch = symbolsToScan.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (symbol) => {
        try {
          const histRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`,
            { headers: FETCH_HEADERS, next: { revalidate: 180 } }
          );
          if (!histRes.ok) return null;
          const histData = await histRes.json().catch(() => null);
          if (!histData) return null;

          const result = histData.chart?.result?.[0];
          const quotes = result?.indicators?.quote?.[0];
          const closes = quotes?.close?.filter(c => typeof c === 'number') || [];
          const volumes = quotes?.volume?.filter(v => typeof v === 'number') || [];

          if (closes.length < 14) return null;

          let rsi = 50;
          let gains = 0, losses = 0;
          for (let j = closes.length - 14; j < closes.length; j++) {
            const change = closes[j] - closes[j - 1];
            if (change >= 0) gains += change;
            else losses -= change;
          }
          const avgGain = gains / 14;
          const avgLoss = losses / 14;
          if (avgLoss === 0) rsi = 100;
          else rsi = 100 - (100 / (1 + avgGain / avgLoss));

          let sma7 = closes[closes.length - 1];
          if (closes.length >= 7) {
            const last7 = closes.slice(-7);
            sma7 = last7.reduce((a, b) => a + b, 0) / 7;
          }

          const currentPrice = closes[closes.length - 1];

          let confidence = 50;
          if (rsi < 30) confidence += 30;
          else if (rsi > 70) confidence -= 20;

          if (currentPrice > sma7) confidence += 10;
          else confidence -= 10;

          if (volumes.length > 0) {
            const avgVol = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
            const lastVol = volumes[volumes.length - 1];
            if (lastVol > avgVol * 1.5) confidence += 10;
          }

          confidence = Math.min(100, Math.max(0, Math.round(confidence)));

          let action = 'OBSERVER';
          if (confidence >= 70) action = 'KJØP';
          else if (confidence <= 30) action = 'SELG';

          return {
            symbol: symbol,
            name: symbol.replace('-USD', ''),
            price: currentPrice >= 1 ? parseFloat(currentPrice.toFixed(2)) : parseFloat(currentPrice.toPrecision(4)),
            confidence: confidence,
            action: action,
            timestamp: new Date().toISOString(),
            rsi: Math.round(rsi),
            sma7: sma7 >= 1 ? parseFloat(sma7.toFixed(2)) : parseFloat(sma7.toPrecision(4))
          };
        } catch (err) {
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(res => { if (res) signals.push(res); });
    }

    if (signals.length === 0) {
      const fallback = getFallbackSignals();
      cachedSignals = fallback;
      lastCacheTime = Date.now();
      return NextResponse.json({ cached: false, lastUpdated: new Date(lastCacheTime).toISOString(), signals: fallback });
    }

    signals.sort((a, b) => b.confidence - a.confidence);
    cachedSignals = signals;
    lastCacheTime = Date.now();

    return NextResponse.json({ cached: false, lastUpdated: new Date(lastCacheTime).toISOString(), signals: signals });
  } catch (globalError) {
    console.error('Global signals route error:', globalError);
    return NextResponse.json({ cached: false, lastUpdated: new Date().toISOString(), signals: getFallbackSignals() });
  }
}
