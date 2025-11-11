import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Editar_faller() {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/obtenir_faller.php?id=${encodeURIComponent(id)}`);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('Resposta no JSON: ' + text.slice(0, 400)); }
        if (!res.ok || data.success === false) throw new Error(data.message || 'Error carregant el faller');
        const f = data.faller || {};
        // Si el colaborador está marcado pero el grupo no es "Col.laborador", asignamos "Col.laborador"
        let grupoFinal = f.grup || '';
        if (f.colaborador && grupoFinal !== 'Col.laborador') {
          grupoFinal = 'Col.laborador';
        }
        setForm({
          nom: f.nom || '',
          cognoms: f.cognoms || '',
          domicili: f.domicili || '',
          telefon: f.telefon || '',
          dni: f.dni || '',
          data_naixement: f.data_naixement || '',
          email: f.email || '',
          edat: f.edat ?? '',
          grup: grupoFinal,
          data_alta: f.data_alta || '',
          categoria: f.categoria || 'Home'
        });
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        id: Number(id),
        ...form,
        edat: form.edat === '' ? null : Number(form.edat),
        colaborador: form.grup === 'Col.laborador' ? 1 : 0
      };
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const res = await fetch(`${API_BASE}/src/controller/modificar_faller.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Resposta no JSON: ' + text.slice(0, 400)); }
      if (!res.ok || data.success === false) throw new Error(data.message || 'No sha pogut actualitzar');

      setMsg('Faller actualitzat correctament');
      setTimeout(() => navigate('/llistar_fallers', { replace: true }), 700);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="form-page"><div className="table-empty">Carregant...</div></div>;
  if (err) return <div className="form-page"><div className="table-empty" style={{ color: '#ffa3a3' }}>{err}</div></div>;

  return (
    <div className="form-page">
      <div className="form-scene">
        <form className="edit-card" onSubmit={handleSubmit}>
          <h2 className="edit-title">Editar Faller #{id}</h2>

          <div className="edit-grid">
            <div className="edit-field">
              <label>Nom</label>
              <input name="nom" value={form.nom} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Cognoms</label>
              <input name="cognoms" value={form.cognoms} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Domicili</label>
              <input name="domicili" value={form.domicili} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Telèfon</label>
              <input name="telefon" value={form.telefon} onChange={handleChange} />
            </div>
            <div className="edit-field">
              <label>DNI</label>
              <input name="dni" value={form.dni} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Data Naixement</label>
              <input type="date" name="data_naixement" value={form.data_naixement} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="edit-field">
              <label>Edat</label>
              <input type="number" min="0" name="edat" value={form.edat} onChange={handleChange} />
            </div>
            <div className="edit-field">
              <label>Grup</label>
              <select name="grup" value={form.grup} onChange={handleChange} required>
                <option value="">Selecciona un grup</option>
                <option value="Cap dels pares és faller">Cap dels pares és faller</option>
                <option value="Un dels pares es faller">Un dels pares es faller</option>
                <option value="Els dos pares son fallers">Els dos pares son fallers</option>
                <option value="Fallers/falleres de brussó">Fallers/falleres de brussó</option>
                <option value="Fallers d'honor">Fallers d'honor</option>
                <option value="Familiar de faller/fallera">Familiar de faller/fallera</option>
                <option value="Col.laborador">Col.laborador</option>
              </select>
            </div>
            <div className="edit-field">
              <label>Categoria</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} required>
                <option value="Home">Home</option>
                <option value="Dona">Dona</option>
                <option value="Xiquet">Xiquet</option>
                <option value="Xiqueta">Xiqueta</option>
              </select>
            </div>
            <div className="edit-field">
              <label>Data Alta</label>
              <input type="date" name="data_alta" value={form.data_alta} onChange={handleChange} />
            </div>
          </div>

          <div className="edit-actions">
            <button type="button" className="btn btn-return" onClick={() => navigate('/llistar_fallers')}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardant...' : 'Guardar canvis'}
            </button>
          </div>

          {msg && <div className="msg-success" style={{ marginTop: 10 }}>{msg}</div>}
          {err && <div className="msg-error" style={{ marginTop: 10 }}>{err}</div>}
        </form>
      </div>
    </div>
  );
}