import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Families() {
  const navigate = useNavigate();
  const [familias, setFamilias] = useState([]);
  const [fallers, setFallers] = useState([]);
  const [familiaId, setFamiliaId] = useState('');
  const [fallerId, setFallerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const familyOptions = familias
    .filter((fam) => fam && typeof fam.apellidos === 'string' && fam.apellidos.trim() !== '')
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' }));
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErr(null);
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
          throw new Error(familiaData.message || 'Error carregant famílies');
        }
        if (!fallerRes.ok || fallerData.success === false) {
          throw new Error(fallerData.message || 'Error carregant fallers');
        }

        setFamilias(Array.isArray(familiaData.data) ? familiaData.data : []);
        setFallers(Array.isArray(fallerData.data) ? fallerData.data : []);
      } catch (error) {
        setErr(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInsert = async () => {
    if (!familiaId || !fallerId) {
      setErr('Selecciona una família i un faller');
      return;
    }

    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const res = await fetch(`${API_BASE}/src/controller/asignar_faller_familia.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familia_id: Number(familiaId), faller_id: Number(fallerId) })
      });

      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Error en la petició');
      }

      setMsg(data.message || 'Faller assignat correctament');
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-scene">
        <div className="form-card">
          <h2 className="form-title">Famílies i Fallers</h2>
          <p className="form-description">Selecciona una família i un faller per assignar-los.</p>

          {loading ? (
            <div className="table-empty">Carregant...</div>
          ) : err ? (
            <div className="table-empty" style={{ color: '#ffa3a3' }}>{err}</div>
          ) : (
            <div className="form-grid">
              <label className="form-field">
                <span className="form-label">Família</span>
                <select className="form-input" value={familiaId} onChange={(e) => setFamiliaId(e.target.value)}>
                  <option value="">Selecciona una família</option>
                  {familyOptions.map((fam) => (
                    <option key={fam.id} value={fam.id}>{fam.apellidos}</option>
                  ))}
                </select>
                {familyOptions.length === 0 && (
                  <div className="msg-info" style={{ marginTop: 8, color: '#5a5a5a' }}>
                    No hi ha cap família donada d'alta encara.
                  </div>
                )}
              </label>

              <label className="form-field">
                <span className="form-label">Faller</span>
                <select className="form-input" value={fallerId} onChange={(e) => setFallerId(e.target.value)}>
                  <option value="">Selecciona un faller</option>
                  {fallers.map((faller) => (
                    <option key={faller.id} value={faller.id}>
                      {`${faller.nom} ${faller.cognoms} (${faller.dni || 'sense DNI'})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className={saving || familyOptions.length === 0 ? 'btn btn--disabled' : 'btn'}
              onClick={handleInsert}
              disabled={saving || loading || familyOptions.length === 0}
            >
              {saving ? 'Insertant...' : 'Insertar'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-return" onClick={() => navigate('/')}>Tornar a Inici</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/Donar_alta_familia')}>Donar de alta família</button>
          </div>

          {msg && <div className="msg-success" style={{ marginTop: 12 }}>{msg}</div>}
          {err && !loading && <div className="msg-error" style={{ marginTop: 12 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}
