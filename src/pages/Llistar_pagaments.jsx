import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../estilos/estilos.css';

export default function Llistar_pagaments() {
  const navigate = useNavigate();
  const [pagaments, setPagaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState('');

  // Cargar lista de pagaments al montar el componente
  useEffect(() => {
    const loadPagaments = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/llista_pagaments.php`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing JSON:', text);
          throw new Error('Respuesta no válida del servidor');
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Error al cargar pagaments');
        }
        
        setPagaments(data.data || []);
      } catch (e) {
        console.error('Error loading pagaments:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPagaments();
  }, []);

  // Filtrar pagaments
  const pagamentsFiltrats = pagaments.filter(pagament => {
    const matchNom = pagament.nom_complet.toLowerCase().includes(filtro.toLowerCase());
    const matchComentaris = pagament.comentaris.toLowerCase().includes(filtro.toLowerCase());
    const matchMetodo = metodoFiltro === '' || pagament.metode_pagament === metodoFiltro;
    
    return (matchNom || matchComentaris) && matchMetodo;
  });

  // Agrupar pagaments per faller
  const pagamentsAgrupats = pagamentsFiltrats.reduce((acc, pagament) => {
    const idFaller = pagament.id_faller;
    
    if (!acc[idFaller]) {
      acc[idFaller] = {
        id_faller: idFaller,
        nom_complet: pagament.nom_complet,
        dni: pagament.dni,
        total_pagament: parseFloat(pagament.total_pagament || 0),
        aportat_pagament: 0,
        falta_per_aportar: parseFloat(pagament.falta_per_aportar || 0),
        pagaments: []
      };
    }
    
    // Sumar la cantidad aportada de este pago
    acc[idFaller].aportat_pagament += parseFloat(pagament.quantitat || 0);
    
    // Añadir el pago a la lista de pagos del faller
    acc[idFaller].pagaments.push(pagament);
    
    return acc;
  }, {});

  // Convertir a array
  const pagamentsAgrupatsList = Object.values(pagamentsAgrupats);

  // Calcular total quantitat de TODOS los pagos (sin filtrar)
  const totalQuantitat = pagaments.reduce((sum, p) => sum + parseFloat(p.quantitat || 0), 0);
  
  // Calcular total aportado: suma de todas las cantidades de los pagos filtrados
  const totalAportat = pagamentsFiltrats.reduce((sum, p) => sum + parseFloat(p.quantitat || 0), 0);
  
  // Calcular total pendiente por fallers únicos filtrados (evitar duplicados)
  const fallersUnics = {};
  pagamentsFiltrats.forEach(p => {
    if (!fallersUnics[p.id_faller]) {
      fallersUnics[p.id_faller] = parseFloat(p.falta_per_aportar || 0);
    }
  });
  
  const totalFalta = Object.values(fallersUnics).reduce((sum, val) => sum + val, 0);

  // Función para generar PDF de pagaments
  const generatePDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Configuración del documento
      doc.setFontSize(20);
      doc.text('Llista de Pagaments - Falla Pare Castells', 20, 20);
      
      // Información adicional
      doc.setFontSize(12);
      doc.text(`Total de pagaments mostrats: ${pagamentsFiltrats.length}`, 20, 35);
      doc.text(`Data de generació: ${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`, 20, 45);
      
      // Información de filtros aplicados
      let yPosition = 55;
      if (filtro) {
        doc.text(`Filtrat per nom/comentaris: "${filtro}"`, 20, yPosition);
        yPosition += 10;
      }
      if (metodoFiltro) {
        doc.text(`Filtrat per mètode: "${metodoFiltro}"`, 20, yPosition);
        yPosition += 10;
      }
      
      // Resumen de totales
      doc.setFontSize(10);
      doc.text(`Total Quantitat: ${totalQuantitat.toFixed(2)} €  |  Total Aportat: ${totalAportat.toFixed(2)} €  |  Total Pendent: ${totalFalta.toFixed(2)} €`, 20, yPosition + 10);
      
      // Preparar datos para la tabla
      const tableColumns = [
        'ID', 'Faller', 'DNI', 'Comentaris', 'Quantitat', 'Data Pago', 'Mètode', 'Total Pago', 'Aportat', 'Pendent', '% Completat'
      ];
      
      const tableRows = pagamentsFiltrats.map(pagament => [
        pagament.id,
        pagament.nom_complet || '',
        pagament.dni || '',
        pagament.comentaris || '',
        `${pagament.quantitat} €`,
        pagament.data_pagament_formatted || '',
        pagament.metode_pagament || '',
        `${pagament.total_pagament} €`,
        `${pagament.aportat_pagament} €`,
        `${pagament.falta_per_aportar} €`,
        pagament.porcentatge_completat ? `${pagament.porcentatge_completat}%` : 'N/A'
      ]);
      
      // Generar tabla
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: yPosition + 20,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [220, 53, 69], // Color rojo para diferenciar de fallers
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
          1: { cellWidth: 40 }, // Faller
          2: { cellWidth: 25 }, // DNI
          3: { cellWidth: 50 }, // Comentaris
          4: { cellWidth: 25, halign: 'right' }, // Quantitat
          5: { cellWidth: 25, halign: 'center' }, // Data Pago
          6: { cellWidth: 25, halign: 'center' }, // Mètode
          7: { cellWidth: 25, halign: 'right' }, // Total Pago
          8: { cellWidth: 25, halign: 'right' }, // Aportat
          9: { cellWidth: 25, halign: 'right' }, // Pendent
          10: { cellWidth: 20, halign: 'center' } // % Completat
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
      const filename = `pagaments_${timestamp}.pdf`;
      
      // Descargar PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setError('Error al generar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="form-page">
        <div className="form-scene">
          <div className="form-card">
            <p>Carregant pagaments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-page">
        <div className="form-scene">
          <div className="form-card">
            <h2 className="form-title">Error</h2>
            <div className="msg-error">{error}</div>
            <button className="btn" onClick={() => navigate('/')}>
              Tornar a l'inici
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-scene">
        <div className="form-card" style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="form-title">Llista de Pagaments</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-return" 
                onClick={() => navigate('/')}
              >
                Tornar a Inici
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/pagaments')}
              >
                Nou Pagament
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="form-grid" style={{ marginBottom: '20px', gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-field">
              <span className="form-label">Buscar per nom o comentaris</span>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="form-input"
                placeholder="Escriu per buscar..."
              />
            </label>
            
            <label className="form-field">
              <span className="form-label">Filtrar per mètode</span>
              <select
                value={metodoFiltro}
                onChange={(e) => setMetodoFiltro(e.target.value)}
                className="form-input"
              >
                <option value="">Tots els mètodes</option>
                <option value="efectiu">Efectiu</option>
                <option value="targeta">Targeta</option>
                <option value="transferencia">Transferència</option>
                <option value="bizum">Bizum</option>
              </select>
            </label>
          </div>

          {/* Resumen de totales */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px', 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Total Quantitat:</strong> {totalQuantitat.toFixed(2)} €
            </div>
            <div>
              <strong>Total Aportat:</strong> {totalAportat.toFixed(2)} €
            </div>
            <div>
              <strong>Total Pendent:</strong> {totalFalta.toFixed(2)} €
            </div>
            <div>
              <strong>Pagaments:</strong> {pagamentsFiltrats.length}
            </div>
          </div>

          {pagamentsAgrupatsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No s'han trobat pagaments amb els filtres aplicats.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginTop: '10px',
                fontSize: '14px' 
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                      Faller
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                      Comentaris
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Quantitat
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      Data
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      Mètode
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Aportat
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                      Pendent
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      % Completat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentsAgrupatsList.map((faller) => {
                    const percentatge = faller.total_pagament > 0 
                      ? ((faller.aportat_pagament / faller.total_pagament) * 100).toFixed(1) 
                      : 0;
                    
                    return (
                      <React.Fragment key={faller.id_faller}>
                        {/* Fila principal del faller con datos consolidados */}
                        <tr style={{ 
                          backgroundColor: faller.falta_per_aportar > 0 ? '#fff3cd' : '#d4edda',
                          fontWeight: 'bold'
                        }}>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }} rowSpan={faller.pagaments.length + 1}>
                            <div>
                              <strong>{faller.nom_complet}</strong>
                              <br />
                              <small style={{ color: '#666' }}>DNI: {faller.dni}</small>
                              <br />
                              <small style={{ color: '#666' }}>
                                {faller.pagaments.length} pagament{faller.pagaments.length !== 1 ? 's' : ''}
                              </small>
                            </div>
                          </td>
                          <td colSpan="4" style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#f0f0f0' }}>
                            <strong>TOTAL FALLER</strong>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', backgroundColor: '#f0f0f0' }}>
                            <strong>{faller.aportat_pagament.toFixed(2)} €</strong>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', backgroundColor: '#f0f0f0' }}>
                            <strong style={{ 
                              color: faller.falta_per_aportar > 0 ? '#e17055' : '#00b894'
                            }}>
                              {faller.falta_per_aportar.toFixed(2)} €
                            </strong>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: '#f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, backgroundColor: '#e9ecef', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${percentatge}%`,
                                  height: '100%',
                                  backgroundColor: percentatge >= 100 ? '#00b894' : percentatge >= 50 ? '#fdcb6e' : '#e17055',
                                  transition: 'width 0.3s ease',
                                  borderRadius: '10px'
                                }}></div>
                              </div>
                              <span style={{ 
                                fontWeight: 'bold',
                                minWidth: '50px',
                                color: percentatge >= 100 ? '#00b894' : percentatge >= 50 ? '#fdcb6e' : '#e17055'
                              }}>
                                {percentatge}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Filas de detalle de cada pago */}
                        {faller.pagaments.map((pagament, index) => (
                          <tr key={pagament.id} style={{ 
                            backgroundColor: '#ffffff',
                            fontSize: '0.9em'
                          }}>
                            <td style={{ padding: '8px', border: '1px solid #ddd', paddingLeft: '20px' }}>
                              {pagament.comentaris}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                              {pagament.quantitat} €
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                              {pagament.data_pagament_formatted}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                backgroundColor: 
                                  pagament.metode_pagament === 'efectiu' ? '#ffeaa7' :
                                  pagament.metode_pagament === 'targeta' ? '#74b9ff' :
                                  pagament.metode_pagament === 'transferencia' ? '#a29bfe' :
                                  pagament.metode_pagament === 'bizum' ? '#fd79a8' : '#ddd',
                                color: '#333'
                              }}>
                                {pagament.metode_pagament}
                              </span>
                            </td>
                            <td colSpan="3" style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                              <small style={{ color: '#999' }}>Pagament individual #{index + 1}</small>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-success" 
              onClick={generatePDF}
              disabled={loading || pagaments.length === 0}
            >
              Descarregar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
