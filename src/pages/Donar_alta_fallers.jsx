import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Donar_alta_fallers() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '',
    cognoms: '',
    domicili: '',
    telefon: '',
    dni: '',
    data_naixement: '',
    email: '',
    edat: '',
    grup: '',
    colaborador: false,
    data_alta: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const payload = {
      nom: form.nom,
      cognoms: form.cognoms,
      domicili: form.domicili,
      telefon: form.telefon,
      dni: form.dni,
      data_naixement: form.data_naixement,
      email: form.email,
      edat: form.edat ? Number(form.edat) : null,
      grup: form.grup,
      colaborador: form.colaborador ? 1 : 0,
      data_alta: form.data_alta
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const url = `${API_BASE}/src/controller/insertar_fallers.php`;

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

      // Registro correcto: mostrar mensaje breve y redirigir al home
      setMsg(data.message || 'Registro insertado correctamente');
      setTimeout(() => {
        navigate('/', { replace: true }); // cambiar '/' por '/home' si es necesario
      }, 700);

      setForm({
        nom: '',
        cognoms: '',
        domicili: '',
        telefon: '',
        dni: '',
        data_naixement: '',
        email: '',
        edat: '',
        grup: '',
        colaborador: false,
        data_alta: ''
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
          <h2 className="form-title">Alta de Faller</h2>

          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Nom</span>
              <input name="nom" value={form.nom} onChange={handleChange} className="form-input" placeholder="Nom" required />
            </label>

            <label className="form-field">
              <span className="form-label">Cognoms</span>
              <input name="cognoms" value={form.cognoms} onChange={handleChange} className="form-input" placeholder="Cognoms" required />
            </label>

            <label className="form-field">
              <span className="form-label">Domicili</span>
              <input name="domicili" value={form.domicili} onChange={handleChange} className="form-input" placeholder="Domicili" required />
            </label>

            <label className="form-field">
              <span className="form-label">Telèfon</span>
              <input name="telefon" value={form.telefon} onChange={handleChange} className="form-input" placeholder="Telèfon" />
            </label>

            <label className="form-field">
              <span className="form-label">DNI</span>
              <input name="dni" value={form.dni} onChange={handleChange} className="form-input" placeholder="DNI" required />
            </label>

            <label className="form-field">
              <span className="form-label">Data Naixement</span>
              <input name="data_naixement" value={form.data_naixement} onChange={handleChange} className="form-input" type="date" required />
            </label>

            <label className="form-field">
              <span className="form-label">Email</span>
              <input name="email" value={form.email} onChange={handleChange} className="form-input" type="email" required />
            </label>

            <label className="form-field">
              <span className="form-label">Edat</span>
              <input name="edat" value={form.edat} onChange={handleChange} className="form-input" type="number" min="0" />
            </label>

            <label className="form-field">
              <span className="form-label">Grup</span>
              <input name="grup" value={form.grup} onChange={handleChange} className="form-input" placeholder="Grup" />
            </label>

            <label className="form-field" style={{ alignItems: 'center' }}>
              <span className="form-label">Colaborador</span>
              <div className="toggle-wrap">
                <input id="colab" name="colaborador" checked={form.colaborador} onChange={handleChange} type="checkbox" className="toggle-input" />
                <label htmlFor="colab" className="toggle-label" />
              </div>
            </label>

            <label className="form-field">
              <span className="form-label">Data de alta</span>
              <input name="data_alta" value={form.data_alta} onChange={handleChange} className="form-input" type="date" />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className={loading ? 'btn btn--disabled' : 'btn'}>
              {loading ? 'Enviando...' : 'Donar de alta'}
            </button>
          </div>

          {msg && <div className="msg-success">{msg}</div>}
          {err && <div className="msg-error">{err}</div>}
        </form>
      </div>
    </div>
  );
}