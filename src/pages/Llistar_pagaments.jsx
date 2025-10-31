import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Llistar_pagaments() {
  const navigate = useNavigate();
  const [pagaments, setPagaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState('');

  // Cargar lista de pagaments al montar el componente
  useEffect(() => {
    const loadPagaments = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/llista_pagaments.php`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing JSON:', text);
          throw new Error('Respuesta no válida del servidor');
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Error al cargar pagaments');
        }
        
        setPagaments(data.data || []);
      } catch (e) {
        console.error('Error loading pagaments:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPagaments();
  }, []);

  // Filtrar pagaments
  const pagamentsFiltrats = pagaments.filter(pagament => {
    const matchNom = pagament.nom_complet.toLowerCase().includes(filtro.toLowerCase());
    const matchComentaris = pagament.comentaris.toLowerCase().includes(filtro.toLowerCase());
    const matchMetodo = metodoFiltro === '' || pagament.metode_pagament === metodoFiltro;
    
    return (matchNom || matchComentaris) && matchMetodo;
  });

  // Calcular totales
  const totalQuantitat = pagamentsFiltrats.reduce((sum, p) => sum + parseFloat(p.quantitat || 0), 0);
  const totalAportat = pagamentsFiltrats.reduce((sum, p) => sum + parseFloat(p.aportat_pagament || 0), 0);
  const totalFalta = pagamentsFiltrats.reduce((sum, p) => sum + parseFloat(p.falta_per_aportar || 0), 0);

  if (loading) {
    return (
      <div className="form-page">
        <div className="form-scene">
          <div className="form-card">
            <p>Carregant pagaments...</p>
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
        <div className="form-card" style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="form-title">Llista de Pagaments</h2>
            <button 
              className="btn" 
              onClick={() => navigate('/pagaments')}
              style={{ marginLeft: '10px' }}
            >
              Nou Pagament
            </button>
          </div>

          {/* Filtros */}
          <div className="form-grid" style={{ marginBottom: '20px', gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-field">
              <span className="form-label">Buscar per nom o comentaris</span>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="form-input"
                placeholder="Escriu per buscar..."
              />
            </label>
            
            <label className="form-field">
              <span className="form-label">Filtrar per mètode</span>
              <select
                value={metodoFiltro}
                onChange={(e) => setMetodoFiltro(e.target.value)}
                className="form-input"
              >
                <option value="">Tots els mètodes</option>
                <option value="efectiu">Efectiu</option>
                <option value="targeta">Targeta</option>
                <option value="transferencia">Transferència</option>
                <option value="bizum">Bizum</option>
              </select>
            </label>
          </div>

          {/* Resumen de totales */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px', 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Total Quantitat:</strong> {totalQuantitat.toFixed(2)} €
            </div>
            <div>
              <strong>Total Aportat:</strong> {totalAportat.toFixed(2)} €
            </div>
            <div>
              <strong>Total Pendent:</strong> {totalFalta.toFixed(2)} €
            </div>
            <div>
              <strong>Pagaments:</strong> {pagamentsFiltrats.length}
            </div>
          </div>

          {pagamentsFiltrats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No s'han trobat pagaments amb els filtres aplicats.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginTop: '10px',
                fontSize: '14px' 
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                      Faller
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                      Comentaris
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Quantitat
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      Data
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      Mètode
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Aportat
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Pendent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentsFiltrats.map((pagament) => (
                    <tr key={pagament.id} style={{ 
                      backgroundColor: parseFloat(pagament.falta_per_aportar) > 0 ? '#fff3cd' : '#d4edda'
                    }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <div>
                          <strong>{pagament.nom_complet}</strong>
                          <br />
                          <small style={{ color: '#666' }}>DNI: {pagament.dni}</small>
                        </div>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {pagament.comentaris}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        <strong>{pagament.quantitat} €</strong>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {pagament.data_pagament_formatted}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 
                            pagament.metode_pagament === 'efectiu' ? '#ffeaa7' :
                            pagament.metode_pagament === 'targeta' ? '#74b9ff' :
                            pagament.metode_pagament === 'transferencia' ? '#a29bfe' :
                            pagament.metode_pagament === 'bizum' ? '#fd79a8' : '#ddd',
                          color: '#333'
                        }}>
                          {pagament.metode_pagament}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {pagament.aportat_pagament} €
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        <span style={{ 
                          color: parseFloat(pagament.falta_per_aportar) > 0 ? '#e17055' : '#00b894',
                          fontWeight: 'bold'
                        }}>
                          {pagament.falta_per_aportar} €
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button className="btn" onClick={() => navigate('/')}>
              Tornar a l'inici
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
