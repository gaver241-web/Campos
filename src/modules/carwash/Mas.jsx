import { useNavigate } from 'react-router-dom'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'

const ITEMS = [
  ['servicios', 'servicios', 'Servicios y tarifas', 'Precios, combos e inventario'],
  ['agenda', 'agenda', 'Agenda', 'Citas y mantenimiento de máquinas'],
  ['reportes', 'reportes', 'Reportes', 'Ventas y ganancia'],
  ['config', 'config', 'Configuración', 'Negocio y plantillas'],
  ['estado/ABC-123', 'link', 'Ver seguimiento del cliente', 'Así lo ve el cliente en su celular'],
]

export default function Mas() {
  const navigate = useNavigate()
  return (
    <>
      <Cabecera titulo="Más opciones" subtitulo="CARWASH CAMPOS" />
      <div className="cw-content cw-overlap">
        <div className="cw-card">
          {ITEMS.map(([ruta, icono, t, s]) => (
            <button key={ruta} className="cw-fila plano boton" onClick={() => navigate(`/carwash/${ruta}`)}>
              <span className="cw-ico"><Icon name={icono} /></span>
              <div className="info"><strong>{t}</strong><div className="cw-meta">{s}</div></div>
              <Icon name="flecha" />
            </button>
          ))}
          <button className="cw-fila plano boton" onClick={() => navigate('/')}>
            <span className="cw-ico"><Icon name="salir" /></span>
            <div className="info"><strong>Cambiar de sistema</strong></div>
          </button>
        </div>
      </div>
    </>
  )
}
