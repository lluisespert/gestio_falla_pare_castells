import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
      (r.grup || '').toLowerCase().includes(q) ||
      (r.categoria || '').toLowerCase().includes(q)
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

  const generatePDF = () => {
    try {
      const doc = new jsPDF('landscape'); // Orientación horizontal para más espacio
      
      // Configuración del documento
      doc.setFontSize(20);
      doc.text('Llista de Fallers - Falla Pare Castells', 20, 20);
      
      // Información adicional
      doc.setFontSize(12);
      doc.text(`Total de fallers mostrats: ${filtered.length}`, 20, 35);
      doc.text(`Data de generació: ${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`, 20, 45);
      
      if (query) {
        doc.text(`Filtrat per: "${query}"`, 20, 55);
      }
      
      // Preparar datos para la tabla (TODOS los datos sin truncar)
      const tableColumns = [
        'ID', 'Nom', 'Cognoms', 'Domicili', 'Telefon', 'DNI', 'Data Naixement', 'Email', 'Edat', 'Grup', 'Categoria', 'Colaborador', 'Data Alta'
      ];
      
      const tableRows = filtered.map(faller => [
        faller.id,
        faller.nom || '',
        faller.cognoms || '',
        faller.domicili || '',
        faller.telefon || '',
        faller.dni || '',
        faller.data_naixement || '',
        faller.email || '',
        faller.edat ?? '',
        faller.grup || '',
        faller.categoria || 'Home',
        faller.colaborador ? 'Sí' : 'No',
        faller.data_alta || ''
      ]);
      
      // Generar tabla con TODOS los datos
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: query ? 65 : 55,
        styles: {
          fontSize: 7, // Fuente más pequeña para acomodar más datos
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // ID
          1: { cellWidth: 25 }, // Nom
          2: { cellWidth: 30 }, // Cognoms  
          3: { cellWidth: 45 }, // Domicili
          4: { cellWidth: 25 }, // Telefon
          5: { cellWidth: 25 }, // DNI
          6: { cellWidth: 25, halign: 'center' }, // Data Naixement
          7: { cellWidth: 45 }, // Email
          8: { cellWidth: 15, halign: 'center' }, // Edat
          9: { cellWidth: 30 }, // Grup
          10: { cellWidth: 20, halign: 'center' }, // Categoria
          11: { cellWidth: 20, halign: 'center' }, // Colaborador
          12: { cellWidth: 25, halign: 'center' }  // Data Alta
        },
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        tableWidth: 'auto',
        pageBreak: 'auto'
      });
      
      // Añadir pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Pàgina ${i} de ${pageCount}`, doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 15);
      }
      
      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const filename = `fallers_${timestamp}.pdf`;
      
      // Descargar PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setErr('Error al generar el PDF');
    }
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
                placeholder="Buscar per nom, dni, email, grup o categoria..."
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
                    <th>Categoria</th>
                    <th>Colaborador</th>
                    <th>Data Alta</th>
                    <th>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
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
                        <span className={`badge ${
                          r.categoria === 'Home' ? 'badge-home' :
                          r.categoria === 'Dona' ? 'badge-dona' :
                          r.categoria === 'Xiquet' ? 'badge-xiquet' :
                          r.categoria === 'Xiqueta' ? 'badge-xiqueta' : ''
                        }`}>
                          {r.categoria || 'Home'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.colaborador ? 'yes' : 'no'}`}>{r.colaborador ? 'Sí' : 'No'}</span>
                      </td>
                      <td>{r.data_alta}</td>
                      <td className="row-actions" style={{ whiteSpace: 'nowrap', position: 'relative', zIndex: 100 }}>
                        <button 
                          type="button" 
                          className="action-btn edit-btn" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(r.id);
                          }}
                          style={{ position: 'relative', zIndex: 100 }}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Botón de acción */}
          <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn"
              onClick={generatePDF}
              style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
              disabled={filtered.length === 0}
            >
              📄 Descarregar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}