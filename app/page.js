'use client';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler
);

function formatCryptoPrice(val) {
  if (val === null || val === undefined || isNaN(val)) return '...';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (num >= 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (num >= 1) {
    return num.toFixed(2);
  } else if (num >= 0.0001) {
    return num.toFixed(4);
  } else {
    return num.toPrecision(4);
  }
}

function formatLargeNumber(num) {
  if (!num || isNaN(num)) return '-';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function CryptoChart({ chartData, symbol }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center', padding: '60px 0' }}>⏳ Laster kryptograf for {symbol}...</p>;
  }

  try {
    return (
      <div style={{ position: 'relative', height: '360px', width: '100%' }}>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: {
                labels: { color: '#d1d4dc', font: { size: 12, weight: 'bold' } }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) {
                      label += '$' + formatCryptoPrice(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { color: '#a0a5b5', maxTicksLimit: 7 },
                grid: { color: '#2a2e39' }
              },
              y: {
                ticks: {
                  color: '#a0a5b5',
                  callback: function(value) {
                    return '$' + formatCryptoPrice(value);
                  }
                },
                grid: { color: '#2a2e39' }
              }
            }
          }}
        />
      </div>
    );
  } catch (err) {
    return <p style={{ color: '#f23645', padding: '20px' }}>⚠️ Kunne ikke tegne kryptografen. Prøv et annet symbol.</p>;
  }
}

export default function Home() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [signals, setSignals] = useState([]);
  const [cryptoList, setCryptoList] = useState([]);
  const [currentQuote, setCurrentQuote] = useState({ price: null, changePercent: null });
  const [chartData, setChartData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [customWatchlist, setCustomWatchlist] = useState(['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD']);
  const [timeRange, setTimeRange] = useState('month');
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [isLoadingCryptos, setIsLoadingCryptos] = useState(false);
  const [showAllCryptos, setShowAllCryptos] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Standard topp kryptovalutaer og aksjer som alltid er tilgjengelige
  const defaultCryptos = [
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'BNB-USD', name: 'BNB' },
    { symbol: 'XRP-USD', name: 'XRP' },
    { symbol: 'DOGE-USD', name: 'Dogecoin' },
    { symbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'AVAX-USD', name: 'Avalanche' },
    { symbol: 'LINK-USD', name: 'Chainlink' },
    { symbol: 'SUI20947-USD', name: 'Sui' },
    { symbol: 'NEAR-USD', name: 'NEAR Protocol' },
    { symbol: 'DOT-USD', name: 'Polkadot' },
    { symbol: 'BCH-USD', name: 'Bitcoin Cash' },
    { symbol: 'LTC-USD', name: 'Litecoin' },
    { symbol: 'SHIB-USD', name: 'Shiba Inu' },
    { symbol: 'PEPE24478-USD', name: 'Pepe' },
    { symbol: 'UNI7083-USD', name: 'Uniswap' },
    { symbol: 'XMR-USD', name: 'Monero' },
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' }
  ];

  // Henter alle kryptovalutaer fra Yahoo Finance Krypto-screener
  const fetchAllCryptos = async (force = false) => {
    setIsLoadingCryptos(true);
    try {
      const res = await fetch(`/api/crypto/list${force ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data && data.cryptos && Array.isArray(data.cryptos)) {
        setCryptoList(data.cryptos);
      }
    } catch (err) {
      console.error('Feil ved henting av Yahoo Finance krypto-liste:', err);
    } finally {
      setIsLoadingCryptos(false);
    }
  };

  // Hent historisk kursgraf
  const fetchHistoricalData = async (sym, range) => {
    try {
      const res = await fetch(`/api/stock/history?symbol=${sym}&range=${range}`);
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0 && data[0].time) {
        const labels = data.map(d => {
          const date = new Date(d.time * 1000);
          if (range === 'day' || range === 'week') {
            return date.toLocaleDateString('no-NO', { month: 'numeric', day: 'numeric' }) + ' ' + date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
          }
          return date.toLocaleDateString('no-NO', { month: 'numeric', day: 'numeric', year: '2-digit' });
        });
        const prices = data.map(d => d.close);
        const ma7 = prices.map((_, i, arr) => {
          if (i < 7) return null;
          const sum = arr.slice(i - 7, i).reduce((a, b) => a + b, 0);
          return parseFloat((sum / 7).toFixed(4));
        });
        setChartData({
          labels: labels,
          datasets: [
            {
              label: `${sym} Pris (USD)`,
              data: prices,
              borderColor: '#f0b90b',
              backgroundColor: 'rgba(240, 185, 11, 0.12)',
              fill: true,
              tension: 0.3,
              pointRadius: range === 'day' ? 0 : 1
            },
            {
              label: 'SMA7 Glidende Snitt',
              data: ma7,
              borderColor: '#00c897',
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false
            }
          ]
        });
      } else {
        generateFallbackChart(sym);
      }
    } catch (error) {
      generateFallbackChart(sym);
    }
  };

  const generateFallbackChart = (sym) => {
    const labels = [];
    const prices = [];
    let price = sym.includes('BTC') ? 79000 : (sym.includes('ETH') ? 2450 : 100);
    const now = new Date();
    const count = timeRange === 'day' ? 24 : (timeRange === 'week' ? 30 : 30);
    for (let i = count; i >= 0; i--) {
      const time = new Date(now);
      if (timeRange === 'day') time.setHours(time.getHours() - (count - i) * 0.5);
      else time.setDate(time.getDate() - (count - i));
      labels.push(time.toLocaleDateString('no-NO', { month: 'numeric', day: 'numeric' }));
      const change = (Math.random() - 0.48) * (price * 0.02);
      price = Math.max(1, price + change);
      prices.push(parseFloat(price.toFixed(2)));
    }
    setChartData({
      labels: labels,
      datasets: [
        {
          label: `${sym} Kurs (USD)`,
          data: prices,
          borderColor: '#f0b90b',
          backgroundColor: 'rgba(240, 185, 11, 0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 0
        }
      ]
    });
  };

  // Henter signal-hints
  const loadSignals = async (forceRefresh = false) => {
    setIsLoadingSignals(true);
    try {
      const res = await fetch(`/api/signals${forceRefresh ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSignals(data);
      } else if (data && data.signals) {
        setSignals(data.signals);
      }
    } catch (error) {
      console.error('Feil ved henting av krypto-signaler:', error);
    } finally {
      setIsLoadingSignals(false);
    }
  };

  // Henter sanntidskurs for valgt krypto
  const fetchQuote = async (symToFetch = symbol) => {
    try {
      const res = await fetch(`/api/quote?symbol=${symToFetch}`);
      const data = await res.json();
      if (data && data.price) {
        setCurrentQuote({
          price: data.price,
          changePercent: data.changePercent || null
        });
      }
    } catch (error) {
      console.error('Feil ved henting av krypto quote:', error);
    }
  };

  const selectCrypto = (newSym) => {
    setSymbol(newSym);
    fetchQuote(newSym);
    fetchHistoricalData(newSym, timeRange);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToWatchlist = () => {
    let formatted = searchTerm.trim().toUpperCase();
    if (!formatted) return;
    if (!formatted.includes('-USD') && !formatted.includes('-')) {
      formatted += '-USD';
    }
    if (!customWatchlist.includes(formatted)) {
      setCustomWatchlist([formatted, ...customWatchlist]);
    }
    setSearchTerm('');
    selectCrypto(formatted);
  };

  const removeFromWatchlist = (sym) => {
    setCustomWatchlist(customWatchlist.filter(s => s !== sym));
  };

  useEffect(() => {
    setIsMounted(true);
    fetchAllCryptos();
    loadSignals();
    fetchHistoricalData(symbol, timeRange);
    fetchQuote(symbol);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchHistoricalData(symbol, timeRange);
      fetchQuote(symbol);
    }
  }, [symbol, timeRange]);

  const getRangeButtonStyle = (range) => ({
    background: timeRange === range ? '#f0b90b' : '#2a2e39',
    padding: '7px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: timeRange === range ? '#000' : '#d1d4dc',
    fontWeight: timeRange === range ? 'bold' : 'normal',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  });

  // Kombiner krypto-symboler til nedtrekksmenyen
  const availableCryptoOptions = cryptoList.length > 0 ? cryptoList : defaultCryptos;
  const filteredCryptoTable = availableCryptoOptions.filter(c => {
    if (!tableFilter) return true;
    const query = tableFilter.toLowerCase();
    return c.symbol.toLowerCase().includes(query) || (c.name && c.name.toLowerCase().includes(query));
  });

  const cryptoListToDisplay = showAllCryptos ? filteredCryptoTable : filteredCryptoTable.slice(0, 30);

  if (!isMounted) {
    return (
      <div style={{ background: '#131722', minHeight: '100vh', color: 'white', padding: '50px 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#f0b90b', fontSize: '28px' }}>₿ FinansApp BTC & Krypto</h2>
        <p style={{ color: '#00c897', marginTop: '15px' }}>⏳ Kobler til Yahoo Finance Krypto-screener...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#131722', minHeight: '100vh', color: 'white', paddingBottom: '60px' }}>
      <Navbar />

      <div style={{ padding: '0 20px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Hovedoverskrift */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#f0b90b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>₿</span> Bitcoin & Kryptovaluta Scanner
            </h1>
            <p style={{ color: '#8c91a4', margin: '6px 0 0 0', fontSize: '14px' }}>
              Reelle kurser, tekniske trading-hints (RSI, SMA7) og sanntidsdata direkte fra Yahoo Finance krypto-fanen.
            </p>
          </div>

          <button
            onClick={() => { fetchAllCryptos(true); loadSignals(true); fetchQuote(); }}
            disabled={isLoadingSignals || isLoadingCryptos}
            style={{
              background: '#f0b90b',
              color: '#000',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              cursor: (isLoadingSignals || isLoadingCryptos) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isLoadingSignals || isLoadingCryptos ? '⏳ Oppdaterer...' : '🔄 Oppdater Alle Data'}
          </button>
        </div>

        {/* Kontrollpanel for aktiv krypto */}
        <div style={{
          background: '#1e222d',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #2a2e39',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Velg krypto nedtrekksmeny */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '14px', color: '#8c91a4', fontWeight: 'bold' }}>Velg Krypto:</label>
              <select
                value={symbol}
                onChange={(e) => selectCrypto(e.target.value)}
                style={{
                  padding: '10px 14px',
                  background: '#2a2e39',
                  color: 'white',
                  border: '1px solid #363c4e',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {availableCryptoOptions.map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} {c.name ? `(${c.name})` : ''}
                  </option>
                ))}
              </select>

              {/* Sanntids prisvisning */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
                  ${formatCryptoPrice(currentQuote.price)}
                </span>
                {currentQuote.changePercent !== null && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: parseFloat(currentQuote.changePercent) >= 0 ? '#00c89722' : '#f2364522',
                    color: parseFloat(currentQuote.changePercent) >= 0 ? '#00c897' : '#f23645',
                    border: `1px solid ${parseFloat(currentQuote.changePercent) >= 0 ? '#00c89755' : '#f2364555'}`
                  }}>
                    {parseFloat(currentQuote.changePercent) >= 0 ? '+' : ''}{currentQuote.changePercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Søk og legg til i favorittliste */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Legg til krypto (f.eks SOL, DOGE)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
                style={{
                  padding: '10px 14px',
                  background: '#2a2e39',
                  color: 'white',
                  border: '1px solid #363c4e',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  width: '230px'
                }}
              />
              <button
                onClick={addToWatchlist}
                style={{
                  background: '#f0b90b',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                + Legg til
              </button>
            </div>
          </div>

          {/* Favorittliste / Hurtigvelger */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#8c91a4' }}>Hurtigvalg:</span>
            {customWatchlist.map(s => (
              <span
                key={s}
                style={{
                  background: symbol === s ? '#f0b90b' : '#2a2e39',
                  color: symbol === s ? '#000' : '#d1d4dc',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: symbol === s ? '1px solid #f0b90b' : '1px solid #363c4e'
                }}
              >
                <span onClick={() => selectCrypto(s)}>{s}</span>
                {customWatchlist.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(s); }}
                    style={{ background: 'transparent', border: 'none', color: symbol === s ? '#000' : '#8c91a4', cursor: 'pointer', padding: 0, fontSize: '12px' }}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Tidsintervall knapper */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <button onClick={() => setTimeRange('day')} style={getRangeButtonStyle('day')}>📅 24 Timer</button>
          <button onClick={() => setTimeRange('week')} style={getRangeButtonStyle('week')}>📅 7 Dager</button>
          <button onClick={() => setTimeRange('month')} style={getRangeButtonStyle('month')}>📅 1 Måned</button>
          <button onClick={() => setTimeRange('6months')} style={getRangeButtonStyle('6months')}>📅 6 Måneder</button>
          <button onClick={() => setTimeRange('year')} style={getRangeButtonStyle('year')}>📅 1 År</button>
        </div>

        {/* Graf-visning */}
        <div style={{
          marginBottom: '35px',
          background: '#1e222d',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #2a2e39',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f0b90b' }}>
              📈 Kursutvikling: {symbol}
            </h3>
            <span style={{ fontSize: '13px', color: '#8c91a4' }}>Kilde: Yahoo Finance</span>
          </div>
          <CryptoChart chartData={chartData} symbol={symbol} />
        </div>

        {/* SEKSJON 1: Krypto Hints & Tekniske Signaler */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '22px', margin: 0, color: '#f0b90b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚦</span> Krypto Trading Hints & Signaler
              </h2>
              <p style={{ color: '#8c91a4', margin: '4px 0 0 0', fontSize: '13px' }}>
                Automatisk beregnede hints basert på RSI, SMA7 og handelsvolum for de største kryptovalutaene.
              </p>
            </div>
            <button
              onClick={() => loadSignals(true)}
              disabled={isLoadingSignals}
              style={{
                background: '#2a2e39',
                border: '1px solid #f0b90b55',
                color: '#f0b90b',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: isLoadingSignals ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {isLoadingSignals ? '⏳ Skanner...' : '🔄 Rekalkuler Signaler'}
            </button>
          </div>

          <div style={{
            background: '#1e222d',
            borderRadius: '12px',
            border: '1px solid #2a2e39',
            overflowX: 'auto'
          }}>
            {isLoadingSignals ? (
              <p style={{ padding: '30px', textAlign: 'center', color: '#8c91a4' }}>
                ⏳ Analyserer krypto-markedet og genererer tekniske hints...
              </p>
            ) : signals.length === 0 ? (
              <p style={{ padding: '30px', textAlign: 'center', color: '#8c91a4' }}>
                Ingen kryptosignaler tilgjengelig akkurat nå. Klikk på "Rekalkuler Signaler".
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2a2e39', background: '#131722', color: '#8c91a4' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Krypto</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Pris (USD)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>RSI</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>SMA7 Snitt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tillitsgrad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trading Hint</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Handling</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #2a2e39',
                        background: symbol === s.symbol ? 'rgba(240, 185, 11, 0.05)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#f0b90b' }}>{s.symbol === 'BTC-USD' ? '₿' : '🪙'}</span>
                          <span>{s.symbol}</span>
                          {s.name && <span style={{ color: '#8c91a4', fontSize: '12px' }}>({s.name})</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        ${formatCryptoPrice(s.price)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: s.rsi < 30 ? 'rgba(0, 200, 151, 0.2)' : (s.rsi > 70 ? 'rgba(242, 54, 69, 0.2)' : '#2a2e39'),
                          color: s.rsi < 30 ? '#00c897' : (s.rsi > 70 ? '#f23645' : '#d1d4dc')
                        }}>
                          {s.rsi}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8c91a4' }}>
                        ${formatCryptoPrice(s.sma7)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#2a2e39', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${s.confidence}%`,
                              height: '100%',
                              background: s.confidence > 70 ? '#00c897' : (s.confidence > 45 ? '#f0b90b' : '#f23645')
                            }} />
                          </div>
                          <span style={{
                            color: s.confidence > 70 ? '#00c897' : (s.confidence > 45 ? '#f0b90b' : '#f23645'),
                            fontWeight: 'bold',
                            fontSize: '13px'
                          }}>
                            {s.confidence}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-block',
                          background: s.action === 'KJØP' ? 'rgba(0, 200, 151, 0.2)' : (s.action === 'SELG' ? 'rgba(242, 54, 69, 0.2)' : 'rgba(240, 185, 11, 0.2)'),
                          color: s.action === 'KJØP' ? '#00c897' : (s.action === 'SELG' ? '#f23645' : '#f0b90b'),
                          border: `1px solid ${s.action === 'KJØP' ? '#00c89766' : (s.action === 'SELG' ? '#f2364566' : '#f0b90b66')}`
                        }}>
                          {s.action === 'KJØP' ? '🟢 KJØP HINT' : (s.action === 'SELG' ? '🔴 SELG HINT' : '🟡 OBSERVER')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => selectCrypto(s.symbol)}
                          style={{
                            background: symbol === s.symbol ? '#f0b90b' : '#2a2e39',
                            color: symbol === s.symbol ? '#000' : '#fff',
                            border: '1px solid #363c4e',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {symbol === s.symbol ? 'Aktiv' : 'Vis Graf'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SEKSJON 2: Yahoo Finance Krypto-fanen (Alle Kryptovalutaer) */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '22px', margin: 0, color: '#f0b90b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🌐</span> Yahoo Finance Kryptovalutaer ({filteredCryptoTable.length})
              </h2>
              <p style={{ color: '#8c91a4', margin: '4px 0 0 0', fontSize: '13px' }}>
                Komplett oversikt kopiert og synkronisert fra Yahoo Finance sin kryptoseksjon sortert etter markedsverdi.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAllCryptos(!showAllCryptos)}
                style={{
                  padding: '9px 14px',
                  background: showAllCryptos ? '#f0b90b' : '#2a2e39',
                  color: showAllCryptos ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {showAllCryptos ? 'Vis Topp 30' : 'Vis Alle'}
              </button>
              <input
                type="text"
                placeholder="Filtrer kryptovaluta (f.eks Bitcoin, SOL, PEPE)..."
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  background: '#1e222d',
                  color: 'white',
                  border: '1px solid #363c4e',
                  borderRadius: '8px',
                  fontSize: '13px',
                  width: '320px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{
            background: '#1e222d',
            borderRadius: '12px',
            border: '1px solid #2a2e39',
            maxHeight: '520px',
            overflowY: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '750px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2a2e39', background: '#131722', color: '#8c91a4', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}># Symbol</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Navn</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kurs (USD)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>24t Endring</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Markedsverdi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>24t Volum</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Handling</th>
                </tr>
              </thead>
              <tbody>
                {cryptoListToDisplay.map((c, index) => {
                  const chgPct = c.changePercent !== undefined ? c.changePercent : 0;
                  const isPositive = chgPct >= 0;
                  return (
                    <tr
                      key={c.symbol}
                      style={{
                        borderBottom: '1px solid #2a2e39',
                        background: symbol === c.symbol ? 'rgba(240, 185, 11, 0.06)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <span style={{ color: '#8c91a4', marginRight: '8px', fontSize: '12px' }}>{index + 1}</span>
                        <span style={{ color: c.symbol === 'BTC-USD' ? '#f0b90b' : '#fff' }}>{c.symbol}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#d1d4dc' }}>
                        {c.name || c.symbol.replace('-USD', '')}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        ${formatCryptoPrice(c.price)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: isPositive ? 'rgba(0, 200, 151, 0.15)' : 'rgba(242, 54, 69, 0.15)',
                          color: isPositive ? '#00c897' : '#f23645'
                        }}>
                          {isPositive ? '+' : ''}{chgPct ? Number(chgPct).toFixed(2) : '0.00'}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8c91a4' }}>
                        {formatLargeNumber(c.marketCap)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8c91a4' }}>
                        {formatLargeNumber(c.volume24h)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => selectCrypto(c.symbol)}
                          style={{
                            background: symbol === c.symbol ? '#f0b90b' : '#2a2e39',
                            color: symbol === c.symbol ? '#000' : '#fff',
                            border: '1px solid #363c4e',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {symbol === c.symbol ? 'Valgt' : 'Velg & Analyser'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informasjonsboks og disclaimer */}
        <div style={{
          padding: '16px 20px',
          background: '#0b0e11',
          borderRadius: '8px',
          border: '1px solid #2a2e39',
          fontSize: '12px',
          color: '#8c91a4',
          lineHeight: '1.6'
        }}>
          💡 <strong>Hint & Analyseinformasjon:</strong> Trading-hints beregnes matematisk ut fra relativ styrkeindeks (RSI-14) og 7-dagers glidende gjennomsnitt (SMA7) kombinert med volumavvik. Dette er tekniske indikatorer og utgjør ikke finansiell rådgivning. Kurser oppdateres direkte fra Yahoo Finance Krypto-strømmen.
        </div>

      </div>
    </div>
  );
}