import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../estilos/estilos.css";

function Home() {
    return (
        <div className="text-center mt-5">
            <h1>Home</h1>
            <p>Bienvenido a la página de inicio</p>
        </div>
    );
}

export default Home;