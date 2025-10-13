import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../estilos/estilos.css";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">Gestió Falla Pare Castells</h1>
        <p className="lead">Benvingut, tria una opció:</p>
      </div>
      <div className="d-flex gap-4">
        <button
          className="btn btn-primary btn-lg px-5 shadow"
          onClick={() => navigate("/Donar_alta_fallers")}
        >
          Donar de alta fallers
        </button>
        <button
          className="btn btn-success btn-lg px-5 shadow"
          onClick={() => navigate("/pagaments")}
        >
          Pagaments
        </button>
      </div>
    </div>
  );
}

export default Home;