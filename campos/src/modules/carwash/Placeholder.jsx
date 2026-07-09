import { useNavigate } from 'react-router-dom'

export default function CarwashPlaceholder() {
  const navigate = useNavigate()
  return (
    <div className="home-principal">
      <span style={{ fontSize: 44 }}>🚗</span>
      <h1>Carwash</h1>
      <p className="subtitle">Este módulo lo construimos en el siguiente paso</p>
      <button className="btn-amarillo" onClick={() => navigate('/')}>Volver al inicio</button>
    </div>
  )
}
