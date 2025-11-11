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
    data_alta: '',
    categoria: 'Home'
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

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
      nom: form.nom,
      cognoms: form.cognoms,
      domicili: form.domicili,
      telefon: form.telefon,
      dni: form.dni,
      data_naixement: form.data_naixement,
      email: form.email,
      edat: form.edat ? Number(form.edat) : null,
      grup: form.grup,
      colaborador: form.grup === 'Col.laborador' ? 1 : 0,
      data_alta: form.data_alta,
      categoria: form.categoria
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

      setMsg(data.message || 'Registro insertado correctamente');
      setTimeout(() => {
        navigate('/', { replace: true });
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
        data_alta: '',
        categoria: 'Home'
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
              <select name="grup" value={form.grup} onChange={handleChange} className="form-input" required>
                <option value="">Selecciona un grup</option>
                <option value="Cap dels pares és faller">Cap dels pares és faller</option>
                <option value="Un dels pares es faller">Un dels pares es faller</option>
                <option value="Els dos pares son fallers">Els dos pares son fallers</option>
                <option value="Fallers/falleres de brussó">Fallers/falleres de brussó</option>
                <option value="Fallers d'honor">Fallers d'honor</option>
                <option value="Familiar de faller/fallera">Familiar de faller/fallera</option>
                <option value="Col.laborador">Col.laborador</option>
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Categoria</span>
              <select name="categoria" value={form.categoria} onChange={handleChange} className="form-input" required>
                <option value="Home">Home</option>
                <option value="Dona">Dona</option>
                <option value="Xiquet">Xiquet</option>
                <option value="Xiqueta">Xiqueta</option>
              </select>
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