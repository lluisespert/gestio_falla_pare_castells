import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Pagaments() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id_faller: '',
    comentaris: '',
    quantitat: '',
    data_pagament: '',
    metode_pagament: ''
  });
  const [fallers, setFallers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFallers, setLoadingFallers] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Cargar lista de fallers al montar el componente
  useEffect(() => {
    const loadFallers = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/llista_fallers.php?format=json`);
        const text = await res.text();
        const data = JSON.parse(text);
        if (!data.success) throw new Error(data.message || 'Error al cargar fallers');
        setFallers(data.data || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingFallers(false);
      }
    };
    loadFallers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const payload = {
      id_faller: Number(form.id_faller),
      comentaris: form.comentaris,
      quantitat: parseFloat(form.quantitat),
      data_pagament: form.data_pagament,
      metode_pagament: form.metode_pagament
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const url = `${API_BASE}/src/controller/insertar_pagament.php`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (errParse) {
        const text = await res.text();
        throw new Error('Respuesta no JSON desde el servidor: ' + text.slice(0, 1000));
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Error en la petición');
      }

      setMsg(data.message || 'Pagament registrat correctament');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 700);

      setForm({
        id_faller: '',
        comentaris: '',
        quantitat: '',
        data_pagament: '',
        metode_pagament: ''
      });
    } catch (error) {
      setErr(error.message);
      console.error('Error enviar formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-scene">
        <form className="form-card" onSubmit={handleSubmit}>
          <h2 className="form-title">Registrar Pagament</h2>

          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Faller</span>
              <select 
                name="id_faller" 
                value={form.id_faller} 
                onChange={handleChange} 
                className="form-input" 
                required
                disabled={loadingFallers}
              >
                <option value="">
                  {loadingFallers ? 'Carregant fallers...' : 'Selecciona un faller'}
                </option>
                {fallers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nom} {f.cognoms}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Comentaris</span>
              <input 
                name="comentaris" 
                value={form.comentaris} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Comentaris del pagament" 
                required 
              />
            </label>

            <label className="form-field">
              <span className="form-label">Quantitat (€)</span>
              <input 
                name="quantitat" 
                type="number" 
                step="0.01" 
                min="0" 
                value={form.quantitat} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="0.00" 
                required 
              />
            </label>

            <label className="form-field">
              <span className="form-label">Data de Pagament</span>
              <input 
                name="data_pagament" 
                type="date" 
                value={form.data_pagament} 
                onChange={handleChange} 
                className="form-input" 
                required 
              />
            </label>

            <label className="form-field">
              <span className="form-label">Mètode de pagament</span>
              <select 
                name="metode_pagament" 
                value={form.metode_pagament} 
                onChange={handleChange} 
                className="form-input" 
                required
              >
                <option value="">Selecciona un mètode</option>
                <option value="efectiu">Efectiu</option>
                <option value="targeta">Targeta</option>
                <option value="transferencia">Transferència</option>
                <option value="bizum">Bizum</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || loadingFallers} className={loading ? 'btn btn--disabled' : 'btn'}>
              {loading ? 'Enviando...' : 'Registrar Pagament'}
            </button>
          </div>

          {msg && <div className="msg-success">{msg}</div>}
          {err && <div className="msg-error">{err}</div>}
        </form>
      </div>
    </div>
  );
}