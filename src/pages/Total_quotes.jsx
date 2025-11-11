import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/estilos.css';

export default function Total_quotes() {
  const navigate = useNavigate();
  const [totals, setTotals] = useState({
    total_pagament: 0,
    aportat_pagament: 0,
    falta_per_aportar: 0,
    total_fallers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTotals = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/gestio_falla_pare_castells';
        const res = await fetch(`${API_BASE}/src/controller/total_quotes.php`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        console.log('Response text:', text); // Para debug
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing JSON:', text);
          throw new Error('Resposta no vàlida del servidor. Comprova que XAMPP està en marxa.');
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Error al carregar totals');
        }
        
        setTotals(data.data);
      } catch (e) {
        console.error('Error loading totals:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadTotals();
  }, []);

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregant...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error: {error}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Tornar a l'inici
        </button>
      </div>
    );
  }

  const percentage = totals.total_pagament > 0 
    ? ((totals.aportat_pagament / totals.total_pagament) * 100).toFixed(2)
    : 0;

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-gradient" 
         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      <div className="total-quotes-container" style={{ maxWidth: '900px', width: '100%', padding: '20px' }}>
        
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-white mb-2" 
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            Total de les Quotes
          </h1>
          <p className="text-white-50 fs-5">Resum financer de la falla</p>
        </div>

        {/* Cards Container */}
        <div className="row g-4 mb-4">
          
          {/* Card 1: Total a Pagar */}
          <div className="col-md-4">
            <div className="card-3d bg-primary">
              <div className="card-3d-content text-white">
                <div className="card-3d-icon mb-3">
                  <i className="bi bi-cash-stack fs-1"></i>
                </div>
                <h5 className="card-3d-title">Total a Pagar</h5>
                <p className="card-3d-amount">{formatEuro(totals.total_pagament)}</p>
                <small className="opacity-75">Import total de totes les quotes</small>
              </div>
            </div>
          </div>

          {/* Card 2: Total Aportat */}
          <div className="col-md-4">
            <div className="card-3d bg-success">
              <div className="card-3d-content text-white">
                <div className="card-3d-icon mb-3">
                  <i className="bi bi-check-circle fs-1"></i>
                </div>
                <h5 className="card-3d-title">Total Aportat</h5>
                <p className="card-3d-amount">{formatEuro(totals.aportat_pagament)}</p>
                <small className="opacity-75">Import ja aportat pels fallers</small>
              </div>
            </div>
          </div>

          {/* Card 3: Total Pendent */}
          <div className="col-md-4">
            <div className="card-3d bg-danger">
              <div className="card-3d-content text-white">
                <div className="card-3d-icon mb-3">
                  <i className="bi bi-exclamation-circle fs-1"></i>
                </div>
                <h5 className="card-3d-title">Total Pendent</h5>
                <p className="card-3d-amount">{formatEuro(totals.falta_per_aportar)}</p>
                <small className="opacity-75">Import que falta per aportar</small>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Card */}
        <div className="card-3d bg-white mb-4">
          <div className="card-3d-content">
            <h5 className="text-center mb-4 fw-bold">Progrés de Recaptació</h5>
            <div className="progress" style={{ height: '40px', borderRadius: '20px' }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                role="progressbar" 
                style={{ width: `${percentage}%` }}
                aria-valuenow={percentage} 
                aria-valuemin="0" 
                aria-valuemax="100">
                <span className="fw-bold fs-6">{percentage}%</span>
              </div>
            </div>
            <div className="d-flex justify-content-between mt-3">
              <small className="text-muted">0%</small>
              <small className="fw-bold text-success">{percentage}% completat</small>
              <small className="text-muted">100%</small>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card-3d bg-info mb-4">
          <div className="card-3d-content text-white text-center">
            <i className="bi bi-people-fill fs-1 mb-2"></i>
            <h5 className="card-3d-title">Total Fallers amb Pagaments</h5>
            <p className="display-5 fw-bold mb-0">{totals.total_fallers}</p>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="text-center">
          <button 
            className="btn btn-light btn-lg shadow-lg px-5"
            onClick={() => navigate('/')}
            style={{ 
              borderRadius: '50px',
              transition: 'all 0.3s ease'
            }}>
            <i className="bi bi-arrow-left me-2"></i>
            Tornar a l'inici
          </button>
        </div>

      </div>

      <style jsx>{`
        .card-3d {
          border-radius: 20px;
          padding: 30px;
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.2),
            0 1px 8px rgba(0,0,0,0.1);
          transform: translateY(0);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .card-3d::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255,255,255,0.1),
            transparent
          );
          transform: rotate(45deg);
          transition: all 0.6s;
        }

        .card-3d:hover {
          transform: translateY(-10px);
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.3),
            0 5px 15px rgba(0,0,0,0.2);
        }

        .card-3d:hover::before {
          left: 100%;
        }

        .card-3d-content {
          position: relative;
          z-index: 1;
        }

        .card-3d-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .card-3d-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }

        .card-3d-amount {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .btn-light:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }

        @media (max-width: 768px) {
          .card-3d {
            padding: 20px;
          }
          
          .card-3d-amount {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
