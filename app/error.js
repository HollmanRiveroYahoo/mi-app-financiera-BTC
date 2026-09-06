'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px 20px', color: 'white', background: '#131722', minHeight: '100vh', textAlign: 'center' }}>
      <h2 style={{ fontSize: '24px', color: '#f23645' }}>⚠️ Noe gikk galt under opplasting</h2>
      <p style={{ color: '#888', margin: '15px 0' }}>{error?.message || 'En uventet feil oppstod.'}</p>
      <button
        onClick={() => reset()}
        style={{ background: '#2962ff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
      >
        🔄 Prøv på nytt
      </button>
    </div>
  );
}