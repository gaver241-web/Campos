import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '', icon: '🏠', label: 'Inicio' },
  { path: 'inventario', icon: '📦', label: 'Inventario' },
  { path: 'ventas', icon: '🧾', label: 'Ventas' },
  { path: 'balance', icon: '📊', label: 'Balance' },
]

export default function AguaGasLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const current = segments.length <= 1 ? '' : segments[segments.length - 1]

  return (
    <div className="app-shell">
      {/* Navegación lateral en Escritorio / Tablet grande */}
      <aside className="sidebar-desktop">
        <div className="sidebar-brand">
          <h1>Campos</h1>
          <span>💧 Agua y Gas</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={current === item.path ? 'active' : ''}
              onClick={() => navigate(item.path ? `/agua-gas/${item.path}` : '/agua-gas')}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button className="sidebar-exit" onClick={() => navigate('/')}>
            <span>🚪</span>
            <span>Cambiar módulo</span>
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="main-area">
        <Outlet />
      </main>

      {/* Navegación inferior en Celular */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={current === item.path ? 'active' : ''}
            onClick={() => navigate(item.path ? `/agua-gas/${item.path}` : '/agua-gas')}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <button onClick={() => navigate('/')}>
          <span className="nav-icon">🚪</span>
          <span>Salir</span>
        </button>
      </nav>
    </div>
  )
}
