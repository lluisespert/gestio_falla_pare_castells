import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Percentatge() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    amb_80: [],
    sense_80: [],
    total_amb_80: 0,
    total_sense_80: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/percentatge.php`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        let responseData;
        
        try {
          responseData = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing JSON:', text);
          throw new Error('Resposta no vàlida del servidor. Comprova que XAMPP està en marxa.');
        }
        
        if (!responseData.success) {
          throw new Error(responseData.message || 'Error al carregar dades');
        }
        
        setData(responseData.data);
      } catch (e) {
        console.error('Error loading data:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="form-page">
        <div className="form-scene">
          <div className="form-card">
            <p>Carregant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-page">
        <div className="form-scene">
          <div className="form-card">
            <h2 className="form-title">Error</h2>
            <div className="msg-error">{error}</div>
            <button className="btn" onClick={() => navigate('/')}>
              Tornar a l'inici
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-scene">
        <div className="form-card" style={{ maxWidth: '1400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 className="form-title">Percentatge de Pagaments (≥80%)</h2>
            <button className="btn btn-return" onClick={() => navigate('/')}>
              Tornar a Inici
            </button>
          </div>

          {/* Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#00b894', fontSize: '2.5rem', margin: '0' }}>{data.total_amb_80}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Fallers amb ≥80%</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#e17055', fontSize: '2.5rem', margin: '0' }}>{data.total_sense_80}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Fallers amb &lt;80%</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#0984e3', fontSize: '2.5rem', margin: '0' }}>
                {data.total_amb_80 + data.total_sense_80}
              </h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Total Fallers</p>
            </div>
          </div>

          {/* Dos columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Columna VERDE: Con ≥80% */}
            <div>
              <h3 style={{
                padding: '15px',
                backgroundColor: '#00b894',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                margin: '0',
                textAlign: 'center'
              }}>
                ✓ Amb ≥80% Pagat ({data.total_amb_80})
              </h3>
              <div style={{
                maxHeight: '600px',
                overflowY: 'auto',
                border: '2px solid #00b894',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                backgroundColor: '#ffffff'
              }}>
                {data.amb_80.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No hi ha fallers amb ≥80% pagat
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Faller</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Aportat</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.amb_80.map((faller, index) => (
                        <tr key={faller.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                            <strong>{faller.nom_complet}</strong>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            {formatEuro(faller.aportat_pagament)} / {formatEuro(faller.total_pagament)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <span style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              backgroundColor: '#00b894',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {faller.percentatge}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Columna ROJA: Con <80% */}
            <div>
              <h3 style={{
                padding: '15px',
                backgroundColor: '#e17055',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                margin: '0',
                textAlign: 'center'
              }}>
                ⚠ Amb &lt;80% Pagat ({data.total_sense_80})
              </h3>
              <div style={{
                maxHeight: '600px',
                overflowY: 'auto',
                border: '2px solid #e17055',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                backgroundColor: '#ffffff'
              }}>
                {data.sense_80.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No hi ha fallers amb &lt;80% pagat
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Faller</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Aportat</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sense_80.map((faller, index) => (
                        <tr key={faller.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                            <strong>{faller.nom_complet}</strong>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            {formatEuro(faller.aportat_pagament)} / {formatEuro(faller.total_pagament)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <span style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              backgroundColor: faller.percentatge >= 50 ? '#fdcb6e' : '#e17055',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {faller.percentatge}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
