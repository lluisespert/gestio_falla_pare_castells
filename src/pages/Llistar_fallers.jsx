import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Llistar_fallers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
    const url = `${API_BASE}/src/controller/llista_fallers.php?format=json`;
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(url, { method: 'GET' });
        const txt = await res.text();
        const data = JSON.parse(txt);
        if (!mounted) return;
        if (!data.success) throw new Error(data.message || 'Error al obtenir dades');
        setRows(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message.includes('JSON') ? 'Resposta no JSON del servidor' : e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const filtered = rows.filter(r => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      String(r.id).includes(q) ||
      (r.nom || '').toLowerCase().includes(q) ||
      (r.cognoms || '').toLowerCase().includes(q) ||
      (r.dni || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.grup || '').toLowerCase().includes(q)
    );
  });

  const handleEdit = (id) => {
    if (!id && id !== 0) {
      console.warn('ID inválido en handleEdit:', id);
      setErr('ID de faller no válido');
      return;
    }
    const path = `/editar_faller/${id}`;
    navigate(path);
  };

  return (
    <div className="form-page" style={{ padding: '28px' }}>
      <div className="form-scene" style={{ perspective: '1000px' }}>
        <div className="table-card" role="region" aria-label="Llistar Fallers">
          <div className="table-header">
            <div>
              <h2 className="form-title" style={{ margin: 0 }}>Llistar Fallers</h2>
              <p style={{ margin: '6px 0 0', color: '#9fb3da' }}>{rows.length} registres</p>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                className="form-input"
                placeholder="Buscar per nom, dni, email o grup..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ minWidth: 260 }}
              />
              <button className="btn btn-return" type="button" onClick={() => navigate('/')}>
                Tornar a Inici
              </button>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">Carregant...</div>
          ) : err ? (
            <div className="table-empty" style={{ color: '#ffa3a3' }}>{err}</div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">No s'han trobat resultats</div>
          ) : (
            <div className="table-wrap">
              <table className="modern-table" cellSpacing="0" cellPadding="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Cognoms</th>
                    <th>Domicili</th>
                    <th>Tel</th>
                    <th>DNI</th>
                    <th>Data Naixement</th>
                    <th>Email</th>
                    <th>Edat</th>
                    <th>Grup</th>
                    <th>Colaborador</th>
                    <th>Data Alta</th>
                    <th>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.nom}</td>
                      <td>{r.cognoms}</td>
                      <td>{r.domicili}</td>
                      <td>{r.telefon}</td>
                      <td>{r.dni}</td>
                      <td>{r.data_naixement}</td>
                      <td>{r.email}</td>
                      <td>{r.edat ?? ''}</td>
                      <td>{r.grup}</td>
                      <td>
                        <span className={`badge ${r.colaborador ? 'yes' : 'no'}`}>{r.colaborador ? 'Sí' : 'No'}</span>
                      </td>
                      <td>{r.data_alta}</td>
                      <td className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="action-btn edit-btn" onClick={() => handleEdit(r.id)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}