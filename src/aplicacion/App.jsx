import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import '../estilos/estilos.css';
import ScrollToTop from "../components/ScrollToTop.jsx";
import Home from "../pages/Home.jsx";
import Donar_alta_fallers from "../pages/Donar_alta_fallers.jsx";
import Llistar_fallers from "../pages/Llistar_fallers.jsx";
import Editar_faller from "../pages/Editar_fallers.jsx";
import Pagaments from "../pages/Pagaments.jsx";
import Llistar_pagaments from "../pages/Llistar_pagaments.jsx";
import Total_quotes from "../pages/Total_quotes.jsx";
import Percentatge from "../pages/Percentatge.jsx";

function App() {
    const [count, setCount] = useState(0)

    return (
        <Router>
            <ScrollToTop>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/Donar_alta_fallers" element={<Donar_alta_fallers />} />
                    <Route path="/llistar_fallers" element={<Llistar_fallers />} />
                    <Route path="/editar_faller/:id" element={<Editar_faller />} />
                    <Route path="/pagaments" element={<Pagaments />} />
                    <Route path="/llistar_pagaments" element={<Llistar_pagaments />} />
                    <Route path="/total_quotes" element={<Total_quotes />} />
                    <Route path="/percentatge" element={<Percentatge />} />
                </Routes>
            </ScrollToTop>
        </Router>
    )
}

export default App