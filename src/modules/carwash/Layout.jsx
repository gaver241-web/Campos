import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icons.jsx'
import './carwash.css'

const NAV = [
  { path: '', icon: 'home', label: 'Inicio', movil: true },
  { path: 'orden', icon: 'orden', label: 'Nuevo ticket', movil: true },
  { path: 'caja', icon: 'caja', label: 'Caja', movil: true },
  { path: 'clientes', icon: 'clientes', label: 'Clientes', movil: true },
  { path: 'servicios', icon: 'servicios', label: 'Servicios', movil: false },
  { path: 'agenda', icon: 'agenda', label: 'Agenda', movil: false },
  { path: 'reportes', icon: 'reportes', label: 'Reportes', movil: false },
  { path: 'config', icon: 'config', label: 'Configuración', movil: false },
]

export default function CarwashLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname.split('/')[2] || ''
  const enMas = current === 'mas' || NAV.some((n) => !n.movil && n.path === current)

  return (
    <div className="cw-shell">
      <nav className="cw-nav" aria-label="Navegación Carwash">
        <div className="cw-brand">
          <img src="/logo-carwash.webp" alt="Carwash Campos" />
        </div>

        <div className="cw-nav-list">
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`cw-nav-item${item.movil ? '' : ' solo-escritorio'}${current === item.path ? ' active' : ''}`}
              aria-current={current === item.path ? 'page' : undefined}
              onClick={() => navigate(`/carwash/${item.path}`)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className={`cw-nav-item solo-movil${enMas ? ' active' : ''}`}
            onClick={() => navigate('/carwash/mas')}
          >
            <Icon name="mas" />
            <span>Más</span>
          </button>
        </div>

        <div className="cw-nav-footer">
          <button className="cw-nav-item" onClick={() => navigate('/')}>
            <Icon name="salir" />
            <span>Cambiar de sistema</span>
          </button>
        </div>
      </nav>

      <main className="cw-main">
        <Outlet />
      </main>
    </div>
  )
}
