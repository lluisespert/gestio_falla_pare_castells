import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../estilos/estilos.css";
import logo from "../img/logo_pare_castells.jpg";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center mb-5">
        <img 
          src={logo} 
          alt="Logo Falla Pare Castells" 
          style={{ 
            maxWidth: '200px', 
            height: 'auto', 
            marginBottom: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }} 
        />
        <h1 className="display-4 fw-bold mb-3">Gestió Falla Pare Castells</h1>
        <p className="lead">Benvingut, tria una opció:</p>
      </div>
      <div className="d-flex gap-4 home-actions">
        <button
          className="btn btn-primary btn-lg shadow"
          onClick={() => navigate("/Donar_alta_fallers")}
        >
          Donar de alta fallers
        </button>
        <button
          className="btn btn-success btn-lg shadow"
          onClick={() => navigate("/pagaments")}
        >
          Pagaments
        </button>
        <button
          className="btn btn-info btn-lg shadow"
          onClick={() => navigate("/llistar_fallers")}
        >
          Llistar Fallers
        </button>
        <button
          className="btn btn-warning btn-lg shadow"
          onClick={() => navigate("/llistar_pagaments")}
        >
          Llistar Pagaments
        </button>
        <button
          className="btn btn-secondary btn-lg shadow"
          onClick={() => navigate("/total_quotes")}
        >
          Total de les quotes
        </button>
        <button
          className="btn btn-dark btn-lg shadow"
          onClick={() => navigate("/percentatge")}
        >
          Percentatge
        </button>
      </div>
    </div>
  );
}

export default Home;