'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItemStyle = (path) => ({
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    background: pathname === path ? '#f0b90b' : '#2a2e39',
    color: pathname === path ? '#000000' : '#d1d4dc',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: pathname === path ? '1px solid #f0b90b' : '1px solid #363c4e'
  });

  return (
    <nav style={{
      background: '#131722',
      borderBottom: '1px solid #2a2e39',
      padding: '12px 20px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '26px' }}>₿</span>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#f0b90b' }}>
            FinansApp BTC & Krypto
          </span>
          <span style={{
            marginLeft: '8px',
            background: '#f0b90b22',
            color: '#f0b90b',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '1px solid #f0b90b44'
          }}>
            Yahoo Finance Crypto Live
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href="/" style={navItemStyle('/')}>
          ⚡ Krypto Hints & Scanner
        </Link>
        <Link href="/upload" style={navItemStyle('/upload')}>
          📁 Last Opp (PHP / HTML)
        </Link>
      </div>
    </nav>
  );
}
