import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-principal">
      <h1>Campos</h1>
      <p className="subtitle">Elige el sistema que deseas usar</p>
      <div className="home-options">
        <button className="home-option agua-gas" onClick={() => navigate('/agua-gas')}>
          <span className="icon">💧⛽</span>
          <span className="label">
            <strong>Venta de Agua y Gas</strong>
            <span>Inventario, ventas y balance</span>
          </span>
        </button>
        <button className="home-option carwash" onClick={() => navigate('/carwash')}>
          <span className="icon">🚗</span>
          <span className="label">
            <strong>Carwash</strong>
            <span>Próximamente</span>
          </span>
        </button>
      </div>
    </div>
  )
}
