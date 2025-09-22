import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../estilos/estilos.css'
import App from '../aplicacion/App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)