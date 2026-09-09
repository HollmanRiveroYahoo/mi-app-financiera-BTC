import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0e11',
      color: '#e0e3eb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#1e222d',
        borderRadius: '16px',
        border: '1px solid #2a2e39',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ fontSize: '36px', color: '#f0b90b', marginBottom: '20px' }}>
          Velkommen til Mi App Financiera
        </h1>
        
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#b2b5be', marginBottom: '30px' }}>
          Få tilgang til eksklusive og automatiserte trading-hints for både <strong>Vanlige Aksjer</strong> og <strong>Kryptovaluta (Bitcoin & Altcoins)</strong>. 
          Våre algoritmer analyserer markedet 24/7 og gir deg kjøps- og salgssignaler basert på solid teknisk analyse.
        </p>

        <div style={{
          backgroundColor: '#131722',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #f0b90b'
        }}>
          <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 10px 0' }}>Kun  i måneden</h2>
          <p style={{ color: '#8c91a4', margin: 0 }}>Full tilgang til alle våre finansielle verktøy, analyser og daglige tips.</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{
            padding: '14px 32px',
            backgroundColor: '#2a2e39',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '1px solid #363c4e',
            transition: 'background 0.2s'
          }}>
            Logg Inn
          </Link>
          
          <Link href="/register" style={{
            padding: '14px 32px',
            backgroundColor: '#f0b90b',
            color: '#000',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(240, 185, 11, 0.3)',
            transition: 'transform 0.2s'
          }}>
            Abonner nå med PayPal
          </Link>
        </div>
      </div>
    </div>
  );
}
