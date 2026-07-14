import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Donar_alta_familia() {
  const navigate = useNavigate();
  const [apellidos, setApellidos] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    if (!apellidos.trim()) {
      setErr('Els cognoms són obligatoris');
      setLoading(false);
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const res = await fetch(`${API_BASE}/src/controller/insertar_familia.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apellidos: apellidos.trim() })
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Resposta no JSON del servidor: ' + text.slice(0, 300)); }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Error en la petició');
      }

      setMsg(data.message || 'Família creada correctament');
      setApellidos('');
      setTimeout(() => navigate('/families'), 700);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-scene">
        <form className="form-card" onSubmit={handleSubmit}>
          <h2 className="form-title">Donar de alta una família</h2>

          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Cognoms de la família</span>
              <input
                name="apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="form-input"
                placeholder="Introdueix els cognoms"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className={loading ? 'btn btn--disabled' : 'btn'}>
              {loading ? 'Enviant...' : 'Donar de alta família'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-return" onClick={() => navigate('/')}>Tornar a Inici</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/families')}>Anar a Famílies</button>
          </div>

          {msg && <div className="msg-success" style={{ marginTop: 12 }}>{msg}</div>}
          {err && <div className="msg-error" style={{ marginTop: 12 }}>{err}</div>}
        </form>
      </div>
    </div>
  );
}
