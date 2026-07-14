import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
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
  const [families, setFamilies] = useState([]);
  const [pagaments, setPagaments] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFallers, setLoadingFallers] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [fallerInfo, setFallerInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [insertedIds, setInsertedIds] = useState(null);

  // Cargar lista de fallers, famílies y pagaments al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const [fallerRes, familyRes, paymentRes] = await Promise.all([
          fetch(`${API_BASE}/src/controller/llista_fallers.php?format=json`),
          fetch(`${API_BASE}/src/controller/llista_familias.php`),
          fetch(`${API_BASE}/src/controller/llista_pagaments.php`)
        ]);

        const [fallerText, familyText, paymentText] = await Promise.all([
          fallerRes.text(),
          familyRes.text(),
          paymentRes.text()
        ]);

        const fallerData = JSON.parse(fallerText);
        const familyData = JSON.parse(familyText);
        const paymentData = JSON.parse(paymentText);

        if (!fallerRes.ok || fallerData.success === false) {
          throw new Error(fallerData.message || 'Error al cargar fallers');
        }
        if (!familyRes.ok || familyData.success === false) {
          throw new Error(familyData.message || 'Error al cargar famílies');
        }
        if (!paymentRes.ok || paymentData.success === false) {
          throw new Error(paymentData.message || 'Error al cargar pagaments');
        }

        setFallers(fallerData.data || []);
        setFamilies(familyData.data || []);
        setPagaments(paymentData.data || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingFallers(false);
      }
    };

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'id_familia') {
      setSelectedFamilyId(value);
      if (value) {
        setForm(prev => ({ ...prev, id_faller: '' }));
        setFallerInfo(null);
      }
    }

    if (name === 'id_faller') {
      setForm(prev => ({ ...prev, id_faller: value }));
      if (value) {
        setSelectedFamilyId('');
        loadFallerInfo(value);
      } else {
        setFallerInfo(null);
      }
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadFallerInfo = async (id_faller) => {
    setLoadingInfo(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
      const res = await fetch(`${API_BASE}/src/controller/info_faller_pagament.php?id_faller=${id_faller}`);
      const text = await res.text();
      const data = JSON.parse(text);
      if (!data.success) throw new Error(data.message || 'Error al cargar informació del faller');
      setFallerInfo(data.data);
    } catch (e) {
      console.error('Error loading faller info:', e);
      setFallerInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  const generateReciboPDF = (reciboData) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('REBUT DE PAGAMENT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Falla Pare Castells', 105, 30, { align: 'center' });
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Información del faller
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Dades del Faller', 20, 45);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Nom: ${reciboData.nom_complet}`, 20, 55);
    doc.text(`DNI: ${reciboData.dni}`, 20, 62);
    doc.text(`Data: ${reciboData.data_pagament}`, 20, 69);
    
    // Información del pago
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Detall del Pagament', 20, 85);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Comentari: ${reciboData.comentaris}`, 20, 95);
    doc.text(`Mètode de pagament: ${reciboData.metode_pagament}`, 20, 102);
    
    // Cuadro de importes
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 115, 170, 50, 'F');
    
    doc.setFontSize(12);
    doc.text('Total Quota:', 30, 125);
    doc.text(`${reciboData.total_pagament.toFixed(2)} €`, 150, 125, { align: 'right' });
    
    doc.text('Aportat anteriorment:', 30, 135);
    doc.text(`${reciboData.aportat_anterior.toFixed(2)} €`, 150, 135, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text('Aportat ara:', 30, 145);
    doc.text(`${reciboData.quantitat_pagada.toFixed(2)} €`, 150, 145, { align: 'right' });
    
    doc.setLineWidth(1);
    doc.line(30, 150, 160, 150);
    
    doc.setFontSize(14);
    doc.text('Total Aportat:', 30, 160);
    doc.text(`${reciboData.total_aportat.toFixed(2)} €`, 150, 160, { align: 'right' });
    
    const pendent = reciboData.total_pagament - reciboData.total_aportat;
    doc.setTextColor(pendent > 0 ? 200 : 0, pendent > 0 ? 0 : 150, 0);
    doc.text('Pendent:', 30, 170);
    doc.text(`${pendent.toFixed(2)} €`, 150, 170, { align: 'right' });
    
    // Porcentaje
    doc.setTextColor(0, 0, 0);
    const percentatge = (reciboData.total_aportat / reciboData.total_pagament * 100).toFixed(1);
    doc.setFontSize(12);
    doc.text(`Percentatge pagat: ${percentatge}%`, 30, 180);
    
    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`Rebut generat el ${new Date().toLocaleDateString('ca-ES')} a les ${new Date().toLocaleTimeString('ca-ES')}`, 105, 280, { align: 'center' });
    
    // Descargar
    const filename = `rebut_${reciboData.nom_complet.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const payload = {
      id_faller: form.id_faller ? Number(form.id_faller) : null,
      id_familia: selectedFamilyId ? Number(selectedFamilyId) : null,
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

      const text = await res.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (errParse) {
        console.error('Error parsing JSON:', text);
        throw new Error('Respuesta no JSON desde el servidor: ' + text.slice(0, 1000));
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Error en la petición');
      }

      setMsg(data.message || 'Pagament registrat correctament');
      if (data.inserted_ids) setInsertedIds(data.inserted_ids);
      
      // Generar PDF del recibo
      if (data.recibo) {
        generateReciboPDF(data.recibo);
      }
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);

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
                required={!selectedFamilyId}
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
              <small style={{ color: '#6c757d' }}>Si seleccionas una família, el faller queda desactivat.</small>
            </label>

            <label className="form-field">
              <span className="form-label">Família</span>
              <select
                name="id_familia"
                value={selectedFamilyId}
                onChange={handleChange}
                className="form-input"
                required={!form.id_faller}
                disabled={loadingFallers}
              >
                <option value="">Selecciona una família</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>{fam.apellidos}</option>
                ))}
              </select>
              <small style={{ color: '#6c757d' }}>Pago por família o per faller, no tots dos.</small>
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

          {/* Información del faller seleccionado */}
          {form.id_faller && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #dee2e6'
            }}>
              <h3 style={{ marginTop: 0, color: '#495057' }}>Informació del Faller</h3>
              
              {loadingInfo ? (
                <p>Carregant informació...</p>
              ) : fallerInfo ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <strong>Total Quota:</strong>
                      <div style={{ fontSize: '1.5rem', color: '#0984e3', fontWeight: 'bold' }}>
                        {fallerInfo.total_pagament.toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <strong>Ja Aportat:</strong>
                      <div style={{ fontSize: '1.5rem', color: '#00b894', fontWeight: 'bold' }}>
                        {fallerInfo.aportat_pagament.toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <strong>Pendent:</strong>
                      <div style={{ fontSize: '1.5rem', color: '#e17055', fontWeight: 'bold' }}>
                        {fallerInfo.falta_per_aportar.toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <strong>Percentatge:</strong>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {((fallerInfo.aportat_pagament / fallerInfo.total_pagament) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '10px', 
                      height: '25px', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{
                        width: `${(fallerInfo.aportat_pagament / fallerInfo.total_pagament) * 100}%`,
                        height: '100%',
                        backgroundColor: 
                          ((fallerInfo.aportat_pagament / fallerInfo.total_pagament) * 100) >= 80 ? '#00b894' :
                          ((fallerInfo.aportat_pagament / fallerInfo.total_pagament) * 100) >= 50 ? '#fdcb6e' : '#e17055',
                        transition: 'width 0.3s ease',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {((fallerInfo.aportat_pagament / fallerInfo.total_pagament) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {form.quantitat && parseFloat(form.quantitat) > 0 && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      backgroundColor: '#d1f2eb',
                      borderRadius: '6px',
                      border: '1px solid #00b894'
                    }}>
                      <strong>Després d'aquest pagament:</strong>
                      <div style={{ marginTop: '8px' }}>
                        <div>Total Aportat: <strong>{(fallerInfo.aportat_pagament + parseFloat(form.quantitat)).toFixed(2)} €</strong></div>
                        <div>Pendent: <strong>{(fallerInfo.falta_per_aportar - parseFloat(form.quantitat)).toFixed(2)} €</strong></div>
                        <div>Percentatge: <strong>{((fallerInfo.aportat_pagament + parseFloat(form.quantitat)) / fallerInfo.total_pagament * 100).toFixed(1)}%</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>No s'ha pogut carregar la informació del faller</p>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading || loadingFallers} className={loading ? 'btn btn--disabled' : 'btn'}>
              {loading ? 'Enviando...' : 'Registrar Pagament'}
            </button>
          </div>

          <div style={{ marginTop: '30px', padding: '22px', backgroundColor: '#f7f9fb', borderRadius: '12px', border: '1px solid #e4e7ec' }}>
            <h3 className="form-title" style={{ fontSize: '1.25rem' }}>Veure Família</h3>
            <p style={{ margin: '10px 0 16px', color: '#555' }}>Selecciona una família per veure els seus components i els pagaments totals registrats.</p>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <label className="form-field">
                <span className="form-label">Família</span>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="form-input"
                  disabled={loadingFallers}
                >
                  <option value="">Selecciona una família</option>
                  {families.map((fam) => (
                    <option key={fam.id} value={fam.id}>{fam.apellidos}</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedFamilyId('')}
                  disabled={loadingFallers || !selectedFamilyId}
                >
                  Netejar selecció
                </button>
              </div>
            </div>
            {selectedFamilyId ? (
              (() => {
                const members = fallers.filter((f) => String(f.familia_id) === String(selectedFamilyId));
                const familyPayments = pagaments.filter((p) => String(p.familia_id) === String(selectedFamilyId));
                const totalFamilyPayments = familyPayments.reduce((sum, p) => sum + parseFloat(p.quantitat || 0), 0);

                return (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '18px' }}>
                      <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #dde3ea' }}>
                        <strong>Components</strong>
                        <div style={{ marginTop: '8px', fontSize: '1.5rem', color: '#2d8cf0' }}>{members.length}</div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #dde3ea' }}>
                        <strong>Pagaments totals</strong>
                        <div style={{ marginTop: '8px', fontSize: '1.5rem', color: '#00b894' }}>{totalFamilyPayments.toFixed(2)} €</div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #dde3ea' }}>
                        <strong>Pagaments registrats</strong>
                        <div style={{ marginTop: '8px', fontSize: '1.5rem', color: '#ffb400' }}>{familyPayments.length}</div>
                      </div>
                    </div>

                    {members.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fff6f0', border: '1px solid #f6c7b6', color: '#8a4b2f' }}>
                        Aquesta família encara no té cap component registrat.
                      </div>
                    ) : (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Components de la família:</strong>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#333' }}>
                          {members.slice(0, 8).map((member) => (
                            <li key={member.id}>{member.nom} {member.cognoms}</li>
                          ))}
                          {members.length > 8 && <li>i {members.length - 8} més...</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div style={{ marginTop: '20px', color: '#6c757d' }}>Selecciona una família per veure informació detallada.</div>
            )}
          </div>

          {msg && <div className="msg-success">{msg}</div>}
          {insertedIds && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff9e6', borderRadius: '8px', border: '1px solid #ffe1a8' }}>
              <strong>Pagament distribuït als IDs:</strong>
              <div style={{ marginTop: '6px', color: '#333' }}>{insertedIds.join(', ')}</div>
            </div>
          )}
          {err && <div className="msg-error">{err}</div>}
        </form>
      </div>
    </div>
  );
}