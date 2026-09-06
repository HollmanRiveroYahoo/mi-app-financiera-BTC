'use client';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewingFile, setViewingFile] = useState(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/upload');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('⚠️ Vennligst velg en fil først.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        fetchFiles();
      } else {
        setMessage(`❌ Feil: ${data.message}`);
      }
    } catch (err) {
      setMessage('❌ En uventet feil oppstod under opplastingen.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/upload?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (viewingFile?.id === id) setViewingFile(null);
        fetchFiles();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  return (
    <div style={{ background: '#1e222d', minHeight: '100vh', color: 'white' }}>
      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '28px', color: '#00c897', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📁 Filopplasting & Serverbehandler
        </h1>
        <p style={{ color: '#888', marginBottom: '25px' }}>
          Last opp <code>index.php</code>, <code>index.html</code> eller konfigurasjonsfiler for å kjøre eller forhåndsvise dem på serveren.
        </p>

        {/* Upload Form Box */}
        <div style={{
          background: '#131722',
          padding: '25px',
          borderRadius: '12px',
          border: '1px solid #2a2e39',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📤 Last opp ny fil</h2>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              border: '2px dashed #2962ff',
              borderRadius: '8px',
              padding: '30px',
              textAlign: 'center',
              background: '#1e222d',
              cursor: 'pointer'
            }}>
              <input
                id="file-input"
                type="file"
                accept=".php,.html,.htm,.txt,.json,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>📄</span>
                <span style={{ color: '#2962ff', fontWeight: 'bold' }}>
                  {selectedFile ? selectedFile.name : 'Klikk her for å velge index.php, index.html eller tekstfil'}
                </span>
                <span style={{ display: 'block', color: '#888', fontSize: '12px', marginTop: '5px' }}>
                  Støttede formater: .php, .html, .txt, .csv, .json
                </span>
              </label>
            </div>

            {message && (
              <div style={{
                padding: '10px 15px',
                borderRadius: '6px',
                background: message.includes('✅') ? '#00c89722' : '#f2364522',
                color: message.includes('✅') ? '#00c897' : '#f23645',
                border: message.includes('✅') ? '1px solid #00c89744' : '1px solid #f2364544',
                fontSize: '14px'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              style={{
                background: uploading || !selectedFile ? '#363c4e' : '#2962ff',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              {uploading ? '⏳ Laster opp...' : '🚀 Last opp til Server'}
            </button>
          </form>
        </div>

        {/* Uploaded Files Table */}
        <div style={{ background: '#131722', padding: '25px', borderRadius: '12px', border: '1px solid #2a2e39' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📋 Opplastede filer på serveren</h2>

          {files.length === 0 ? (
            <p style={{ color: '#888' }}>Ingen filer opplastet ennå.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2a2e39', textAlign: 'left', color: '#888' }}>
                    <th style={{ padding: '10px' }}>Filnavn</th>
                    <th style={{ padding: '10px' }}>Størrelse</th>
                    <th style={{ padding: '10px' }}>Opplastet</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} style={{ borderBottom: '1px solid #2a2e39' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: file.name.endsWith('.php') ? '#f0b90b' : '#00c897' }}>
                        {file.name.endsWith('.php') ? '🐘 ' : '🌐 '} {file.name}
                      </td>
                      <td style={{ padding: '10px', color: '#aaa' }}>{(file.size / 1024).toFixed(1)} KB</td>
                      <td style={{ padding: '10px', color: '#aaa' }}>{new Date(file.uploadedAt).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setViewingFile(file)}
                          style={{ background: '#2a2e39', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          👁️ Forhåndsvis
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          style={{ background: '#f2364522', border: '1px solid #f2364544', color: '#f23645', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Slett
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Code Viewer Modal / Drawer */}
        {viewingFile && (
          <div style={{
            marginTop: '30px',
            background: '#0b0e11',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #2962ff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '16px', color: '#2962ff' }}>
                📄 Forhåndsvisning: {viewingFile.name}
              </h3>
              <button
                onClick={() => setViewingFile(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕ Lukk
              </button>
            </div>
            <pre style={{
              background: '#131722',
              padding: '15px',
              borderRadius: '8px',
              overflowX: 'auto',
              color: '#00c897',
              fontFamily: 'monospace',
              fontSize: '13px',
              maxHeight: '400px'
            }}>
              {viewingFile.content || '// Tom fil'}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
