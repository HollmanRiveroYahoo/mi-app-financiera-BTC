'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.message && data.message.includes('Testbruker opprettet')) {
          setError(data.message);
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Innlogging feilet');
      }
    } catch (err) {
      setError('Kunne ikke koble til serveren.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0e11',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#1e222d',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #2a2e39',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: '#f0b90b', textAlign: 'center', marginBottom: '30px' }}>Logg Inn</h1>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(242, 54, 69, 0.15)', color: '#f23645', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#8c91a4', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Brukernavn</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', backgroundColor: '#131722', color: '#fff', border: '1px solid #363c4e', borderRadius: '8px', outline: 'none'
              }} 
            />
          </div>
          <div>
            <label style={{ color: '#8c91a4', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Passord</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', backgroundColor: '#131722', color: '#fff', border: '1px solid #363c4e', borderRadius: '8px', outline: 'none'
              }} 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '14px',
              backgroundColor: '#f0b90b',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}>
            {loading ? 'Logger inn...' : 'Logg Inn'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/register" style={{ color: '#8c91a4', textDecoration: 'none', fontSize: '14px' }}>
            Har du ikke en konto? <span style={{ color: '#f0b90b' }}>Abonner her</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
