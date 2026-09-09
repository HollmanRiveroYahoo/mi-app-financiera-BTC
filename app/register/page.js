'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Link from 'next/link';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Her må du bytte ut med din ekte PayPal Plan ID senere
  const PAYPAL_PLAN_ID = 'P-DIN_EGEN_PLAN_ID_HER';

  const handleRegisterSuccess = async (subscriptionId) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, subscriptionId })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Feil ved registrering i databasen');
      }
    } catch (err) {
      setError('Kunne ikke koble til serveren.');
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
        <h1 style={{ color: '#f0b90b', textAlign: 'center', marginBottom: '10px' }}>Abonner (/mnd)</h1>
        <p style={{ color: '#8c91a4', textAlign: 'center', fontSize: '14px', marginBottom: '30px' }}>
          Opprett ditt brukernavn og passord, og start abonnementet ditt via PayPal.
        </p>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(242, 54, 69, 0.15)', color: '#f23645', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ color: '#00c897', textAlign: 'center', padding: '20px', backgroundColor: 'rgba(0, 200, 151, 0.1)', borderRadius: '8px' }}>
            Betaling godkjent og konto opprettet! Sender deg til innlogging...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#8c91a4', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Ønsket Brukernavn</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                style={{
                  width: '100%', padding: '12px', backgroundColor: '#131722', color: '#fff', border: '1px solid #363c4e', borderRadius: '8px', outline: 'none'
                }} 
              />
            </div>
            
            <div style={{ marginTop: '20px' }}>
              {username.length > 2 && password.length > 3 ? (
                <PayPalScriptProvider options={{ 
                  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                  vault: true,
                  intent: "subscription"
                }}>
                  <PayPalButtons
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        'plan_id': PAYPAL_PLAN_ID
                      });
                    }}
                    onApprove={async (data, actions) => {
                      await handleRegisterSuccess(data.subscriptionID);
                    }}
                    onError={(err) => {
                      setError("PayPal feil: " + err.message);
                    }}
                  />
                </PayPalScriptProvider>
              ) : (
                <div style={{ color: '#8c91a4', fontSize: '13px', textAlign: 'center', padding: '20px', border: '1px dashed #363c4e', borderRadius: '8px' }}>
                  Fyll inn brukernavn og passord først for å aktivere PayPal-knappen.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/login" style={{ color: '#8c91a4', textDecoration: 'none', fontSize: '14px' }}>
            Har du allerede en konto? <span style={{ color: '#f0b90b' }}>Logg inn her</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
