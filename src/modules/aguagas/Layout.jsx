import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icons.jsx'

const NAV_ITEMS = [
  { path: '', icon: 'home', label: 'Inicio' },
  { path: 'inventario', icon: 'inventario', label: 'Inventario' },
  { path: 'ventas', icon: 'ventas', label: 'Ventas' },
  { path: 'balance', icon: 'balance', label: 'Balance' },
]

export default function AguaGasLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const ultimo = location.pathname.split('/').pop()
  const current = ultimo === 'agua-gas' ? '' : ultimo

  return (
    <div className="app-shell">
      <nav className="nav" aria-label="Navegación principal">
        <div className="sidebar-brand">
          <strong>Campos</strong>
          <span>Agua y Gas</span>
        </div>

        <div className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`nav-item${current === item.path ? ' active' : ''}`}
              aria-current={current === item.path ? 'page' : undefined}
              onClick={() => navigate(`/agua-gas/${item.path}`)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="nav-item salir" onClick={() => navigate('/')}>
            <Icon name="salir" />
            <span>Salir</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate('/')}>
            <Icon name="salir" />
            <span>Cambiar de sistema</span>
          </button>
        </div>
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
