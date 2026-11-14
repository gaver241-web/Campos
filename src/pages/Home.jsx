import { useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../auth.jsx'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-principal conpie">
      <div className="home-body">
        <h1 className="sr-only">Campos</h1>
        <img className="home-logo-gaver" src="/logo-gaver.webp" alt="Gaver Studio" />
        <p className="subtitle">Elige el sistema que deseas usar</p>
        <div className="home-options">
          <button className="home-option agua-gas" onClick={() => navigate('/agua-gas')}>
            <span className="icon">
              <img src="/logo-campos.webp" alt="" />
            </span>
            <span className="label">
              <strong>Venta de Agua y Gas</strong>
              <span>Inventario, ventas y balance</span>
            </span>
          </button>
          <button className="home-option carwash" onClick={() => navigate('/carwash')}>
            <span className="icon">
              <img src="/logo-carwash.webp" alt="" />
            </span>
            <span className="label">
              <strong>Carwash Campos</strong>
              <span>Órdenes, caja y clientes</span>
            </span>
          </button>
        </div>
      </div>

      <footer className="home-footer">
        <button className="home-salir" onClick={cerrarSesion}>Cerrar sesión</button>
        <br />
        Diseñado por{' '}
        <a href="https://gaverstudio.com/" target="_blank" rel="noopener noreferrer">
          Gaver Studio
        </a>
      </footer>
    </div>
  )
}
