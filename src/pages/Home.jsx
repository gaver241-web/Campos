import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-principal">
      <div className="home-brand">
        <span className="home-badge">Sistema de Gestión</span>
        <h1>Campos</h1>
        <p className="subtitle">Selecciona el módulo con el que deseas trabajar</p>
      </div>

      <div className="home-options">
        <button className="home-option agua-gas" onClick={() => navigate('/agua-gas')}>
          <span className="icon">💧</span>
          <span className="label">
            <strong>Venta de Agua y Gas</strong>
            <span>Control de inventario, ventas y balance</span>
          </span>
          <span className="arrow">→</span>
        </button>

        <button className="home-option carwash" onClick={() => navigate('/carwash')}>
          <span className="icon">🚗</span>
          <span className="label">
            <strong>Carwash</strong>
            <span>Módulo próximamente disponible</span>
          </span>
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  )
}
