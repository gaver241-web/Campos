import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth.jsx'
import Cabecera from './Cabecera.jsx'
import { useStore, acc, totalOrden } from './store.js'
import { soles, hoy, sumarDias, catEmoji, catNombre } from './data.js'

const COLUMNAS = [
  { id: 'espera', titulo: 'En espera', btn: 'Pasar a lavado', sig: 'lavado' },
  { id: 'lavado', titulo: 'En lavado', btn: 'Marcar listo', sig: 'listo' },
  { id: 'listo', titulo: 'Listo', btn: 'Ir a cobrar', sig: null },
]
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function Dashboard() {
  const { rol } = useAuth()
  const navigate = useNavigate()
  const { ordenes, productos, maquinas } = useStore()
  const [tab, setTab] = useState('espera')

  const activas = ordenes.filter((o) => ['espera', 'lavado', 'listo'].includes(o.estado)).sort((a, b) => a.ts - b.ts)
  const cuenta = (e) => activas.filter((o) => o.estado === e).length
  const pagadas = ordenes.filter((o) => o.pagado)
  const ingresosHoy = pagadas.filter((o) => o.fechaPago === hoy()).reduce((a, o) => a + totalOrden(o), 0)

  const semana = Array.from({ length: 7 }, (_, i) => {
    const f = sumarDias(hoy(), i - 6)
    return { d: DIAS[new Date(f + 'T12:00:00').getDay()], v: pagadas.filter((o) => o.fechaPago === f).reduce((a, o) => a + totalOrden(o), 0) }
  })
  const max = Math.max(1, ...semana.map((s) => s.v))

  const conteo = {}
  ordenes.filter((o) => o.efectos).forEach((o) => o.items.filter((i) => i.tipo !== 'extra').forEach((i) => { conteo[i.nombre] = (conteo[i.nombre] || 0) + Number(i.cant) }))
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxTop = Math.max(1, ...top.map((t) => t[1]))

  const alertas = [
    ...maquinas.filter((m) => Number(m.limite) > 0 && m.uso / m.limite >= 0.85).map((m) => `${m.nombre}: ${m.tarea} (${m.uso}/${m.limite})`),
    ...productos.filter((p) => Number(p.stock) < Number(p.minimo)).map((p) => `Stock bajo: ${p.nombre} (${p.stock})`),
  ]

  const accion = (col, o) => (col.sig ? acc.cambiarEstado(o.id, col.sig) : navigate('/carwash/caja'))

  return (
    <>
      <Cabecera titulo="CARWASH CAMPOS" subtitulo="Patio en tiempo real" logo />
      <div className="cw-content cw-overlap">
        <div className="cw-kpis">
          <div className="cw-kpi destacada"><span className="et">Ingresos de hoy</span><span className="val">{soles(ingresosHoy)}</span></div>
          <div className="cw-kpi"><span className="et">En espera</span><span className="val">{cuenta('espera')}</span></div>
          <div className="cw-kpi"><span className="et">En lavado</span><span className="val">{cuenta('lavado')}</span></div>
          <div className="cw-kpi"><span className="et">Listos</span><span className="val verde">{cuenta('listo')}</span></div>
        </div>

        {alertas.length > 0 && (
          <div className="cw-alerta"><strong>Avisos</strong><ul>{alertas.map((a) => <li key={a}>{a}</li>)}</ul></div>
        )}

        <h3 className="cw-titulo">Patio</h3>
        {ordenes.length === 0 && (
          <div className="cw-card centro">
            <p><b>¡Bienvenido!</b> Aún no hay tickets.</p>
            <p className="cw-nota">{rol === 'empleado' ? 'Registra el primer ticket del día.' : 'Primero crea tus servicios y precios, luego registra tu primer ticket.'}</p>
            <div className="cw-btn-fila" style={{ width: '100%' }}>
              {rol !== 'empleado' && <button className="cw-btn ghost" onClick={() => navigate('/carwash/servicios')}>Crear servicios</button>}
              <button className="cw-btn" onClick={() => navigate('/carwash/orden')}>Nuevo ticket</button>
            </div>
          </div>
        )}
        <div className="cw-segmented solo-movil">
          {COLUMNAS.map((c) => <button key={c.id} className={tab === c.id ? 'active' : ''} onClick={() => setTab(c.id)}>{c.titulo} <b>{cuenta(c.id)}</b></button>)}
        </div>
        <div className="cw-kanban">
          {COLUMNAS.map((col) => (
            <section key={col.id} className={`cw-col ${col.id}${tab === col.id ? ' is-active' : ''}`}>
              <h4>{col.titulo} <span>{cuenta(col.id)}</span></h4>
              {cuenta(col.id) === 0 && <p className="cw-vacio">Sin vehículos</p>}
              {activas.filter((o) => o.estado === col.id).map((o) => (
                <article key={o.id} className="cw-orden">
                  <div className="top"><span className="cw-placa">{o.placa}</span><span className="hora">{o.hora}</span></div>
                  <div className="det">{catEmoji(o.cat)} {catNombre(o.cat)} · {o.items.map((i) => i.nombre).join(', ')}</div>
                  <div className="cw-btn-fila">
                    <button className="cw-btn mini" style={{ flex: 1 }} onClick={() => accion(col, o)}>{col.btn}</button>
                    <button className="cw-btn mini ghost" onClick={() => navigate(`/carwash/orden/${o.id}`)}>Editar</button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>

        <div className="cw-dos">
          <div className="cw-card">
            <h3>Ingresos de los últimos 7 días</h3>
            <div className="cw-barras">
              {semana.map((s, i) => (
                <div key={i} className="barra"><span className="monto">{s.v ? Math.round(s.v) : ''}</span><i style={{ height: `${(s.v / max) * 100}%` }} /><span>{s.d}</span></div>
              ))}
            </div>
          </div>
          <div className="cw-card">
            <h3>Servicios más pedidos</h3>
            {top.length === 0 && <p className="cw-vacio">Aparecerán cuando cobres tus primeros tickets.</p>}
            {top.map(([n, c]) => (
              <div key={n} className="cw-hbar"><div className="fila"><span>{n}</span><b>{c}</b></div><div className="pista"><i style={{ width: `${(c / maxTop) * 100}%` }} /></div></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
