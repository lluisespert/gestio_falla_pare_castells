import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../estilos/estilos.css";

function Donar_alta_fallers () {
  const [form, setForm] = React.useState({
    nom: "",
    cognoms: "",
    domicili: "",
    telefon: "",
    dni: "",
    data_naixement: "",
    email: "",
    edat: "",
    grup_colaborador: "",
    data_alta: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost/gestio_falla_pare_castells/src/controller/insertar_fallers.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.success) {
        alert("Faller insertado correctamente");
        setForm({
          nom: "",
          cognoms: "",
          domicili: "",
          telefon: "",
          dni: "",
          data_naixement: "",
          email: "",
          edat: "",
          grup_colaborador: "",
          data_alta: ""
        });
      } else {
        alert(data.message || "Error al insertar");
        if (data.message && data.message.includes("Error de conexión")) {
          console.error("Detalle de error de conexión:", data.message);
        }
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
      console.error("Error al conectar con el servidor:", error);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient" style={{background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)"}}>
      <form className="p-5 rounded-4 shadow-lg bg-white" style={{minWidth: 350, maxWidth: 500, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"}} onSubmit={handleSubmit}>
        <h2 className="mb-4 text-center fw-bold" style={{textShadow: "1px 1px 8px #cfdef3"}}>Donar de alta fallers</h2>
        <div className="mb-3">
          <label className="form-label">Nom</label>
          <input type="text" className="form-control form-control-lg" name="nom" value={form.nom} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Cognoms</label>
          <input type="text" className="form-control form-control-lg" name="cognoms" value={form.cognoms} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Domicili</label>
          <input type="text" className="form-control form-control-lg" name="domicili" value={form.domicili} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Telèfon</label>
          <input type="tel" className="form-control form-control-lg" name="telefon" value={form.telefon} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">DNI</label>
          <input type="text" className="form-control form-control-lg" name="dni" value={form.dni} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Data Naixement</label>
          <input type="date" className="form-control form-control-lg" name="data_naixement" value={form.data_naixement} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control form-control-lg" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Edat</label>
          <input type="number" className="form-control form-control-lg" name="edat" value={form.edat} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Grup Col·laborador</label>
          <input type="text" className="form-control form-control-lg" name="grup_colaborador" value={form.grup_colaborador} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Data Alta</label>
          <input type="date" className="form-control form-control-lg" name="data_alta" value={form.data_alta} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100 mt-3 shadow">Donar d'alta</button>
      </form>
    </div>
  );
}

export default Donar_alta_fallers;