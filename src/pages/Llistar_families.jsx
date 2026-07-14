import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Llistar_families() {
  const navigate = useNavigate();
  const [familias, setFamilias] = useState([]);
  const [fallers, setFallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const [familiaRes, fallerRes] = await Promise.all([
          fetch(`${API_BASE}/src/controller/llista_familias.php`),
          fetch(`${API_BASE}/src/controller/llista_fallers.php?format=json`)
        ]);

        const familiaText = await familiaRes.text();
        const fallerText = await fallerRes.text();
        const familiaData = JSON.parse(familiaText);
        const fallerData = JSON.parse(fallerText);

        if (!familiaRes.ok || familiaData.success === false) {
          throw new Error(familiaData.message || 'Error al carregar famílies');
        }
        if (!fallerRes.ok || fallerData.success === false) {
          throw new Error(fallerData.message || 'Error al carregar fallers');
        }

        setFamilias(Array.isArray(familiaData.data) ? familiaData.data : []);
        setFallers(Array.isArray(fallerData.data) ? fallerData.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const membersByFamily = fallers.reduce((acc, faller) => {
    const key = faller.familia_id || 'none';
    if (!acc[key]) acc[key] = [];
    acc[key].push(faller);
    return acc;
  }, {});

  const filteredFamilies = familias
    .filter((fam) => fam.apellidos.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="form-page">
      <div className="form-scene">
        <div className="form-card" style={{ maxWidth: '1100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 className="form-title">Llistar Famílies</h2>
              <p className="form-description">Veure les famílies donades d'alta i el nombre de components.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/Donar_alta_familia')}>Donar de alta família</button>
              <button className="btn btn-return" onClick={() => navigate('/')}>Tornar a Inici</button>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '20px', gridTemplateColumns: '1fr 300px' }}>
            <label className="form-field">
              <span className="form-label">Buscar famílies</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                placeholder="Escriu el cognom de la família..."
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <div>
                <span className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Total famílies</span>
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                  {familias.length}
                </div>
              </div>
              <div>
                <span className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Total components</span>
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                  {fallers.length}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">Carregant famílies...</div>
          ) : error ? (
            <div className="table-empty" style={{ color: '#d9534f' }}>{error}</div>
          ) : filteredFamilies.length === 0 ? (
            <div className="table-empty">No s'han trobat famílies amb aquest filtre.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Família</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Components</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Components principals</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFamilies.map((fam) => {
                    const members = membersByFamily[fam.id] || [];
                    const mainNames = members.slice(0, 4).map((m) => `${m.nom} ${m.cognoms}`);
                    return (
                      <tr key={fam.id}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{fam.apellidos}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{members.length}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{mainNames.length > 0 ? mainNames.join(', ') : 'Sense components'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
