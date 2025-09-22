import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import '../estilos/estilos.css';
import ScrollToTop from "../components/ScrollToTop.jsx";
import Home from "../pages/Home.jsx";

function App() {
    const [count, setCount] = useState(0)

    return (
        <Router>
            <ScrollToTop>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </ScrollToTop>
        </Router>
    )
}

export default App