import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '', icon: '🏠', label: 'Home' },
  { path: 'inventario', icon: '📦', label: 'Inventario' },
  { path: 'ventas', icon: '🧾', label: 'Ventas' },
  { path: 'balance', icon: '📊', label: 'Balance' },
]

export default function AguaGasLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname.split('/').pop() === 'agua-gas' ? '' : location.pathname.split('/').pop()

  return (
    <div className="app-shell">
      <Outlet />
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={current === item.path ? 'active' : ''}
            onClick={() => navigate(`/agua-gas/${item.path}`)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button onClick={() => navigate('/')}>
          <span className="nav-icon">🚪</span>
          Salir
        </button>
      </nav>
    </div>
  )
}
