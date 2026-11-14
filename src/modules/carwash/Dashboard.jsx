import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { ORDENES_INICIALES, SEMANA, TOP_SERVICIOS, MAQUINAS, PRODUCTOS, soles, catEmoji, catNombre } from './data.js'

const COLUMNAS = [
  { id: 'espera', titulo: 'En espera', btn: 'Pasar a lavado' },
  { id: 'lavado', titulo: 'En lavado', btn: 'Marcar listo' },
  { id: 'listo', titulo: 'Listo', btn: 'Entregado' },
]
const SIGUIENTE = { espera: 'lavado', lavado: 'listo', listo: 'entregado' }

export default function Dashboard() {
  const [ordenes, setOrdenes] = useState(ORDENES_INICIALES)
  const [tab, setTab] = useState('espera')

  const avanzar = (id) =>
    setOrdenes((lista) =>
      lista.map((o) => (o.id === id ? { ...o, estado: SIGUIENTE[o.estado] } : o)).filter((o) => o.estado !== 'entregado')
    )

  const cuenta = (e) => ordenes.filter((o) => o.estado === e).length
  const max = Math.max(...SEMANA.map((s) => s.v))
  const maxTop = Math.max(...TOP_SERVICIOS.map((s) => s.c))
  const alertas = [
    ...MAQUINAS.filter((m) => m.uso / m.limite >= 0.85).map((m) => `${m.nombre}: ${m.tarea} (${m.uso}/${m.limite})`),
    ...PRODUCTOS.filter((p) => p.stock < p.minimo).map((p) => `Stock bajo: ${p.nombre} (${p.stock})`),
  ]

  return (
    <>
      <Cabecera titulo="CARWASH CAMPOS" subtitulo="Patio en tiempo real" logo />

      <div className="cw-content cw-overlap">
        <div className="cw-kpis">
          <div className="cw-kpi destacada">
            <span className="et">Ingresos de hoy</span>
            <span className="val">{soles(450)}</span>
          </div>
          <div className="cw-kpi">
            <span className="et">En espera</span>
            <span className="val">{cuenta('espera')}</span>
          </div>
          <div className="cw-kpi">
            <span className="et">En lavado</span>
            <span className="val">{cuenta('lavado')}</span>
          </div>
          <div className="cw-kpi">
            <span className="et">Listos</span>
            <span className="val verde">{cuenta('listo')}</span>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="cw-alerta">
            <strong>Avisos</strong>
            <ul>
              {alertas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <h3 className="cw-titulo">Patio</h3>
        <div className="cw-segmented solo-movil">
          {COLUMNAS.map((c) => (
            <button key={c.id} className={tab === c.id ? 'active' : ''} onClick={() => setTab(c.id)}>
              {c.titulo} <b>{cuenta(c.id)}</b>
            </button>
          ))}
        </div>

        <div className="cw-kanban">
          {COLUMNAS.map((col) => (
            <section key={col.id} className={`cw-col ${col.id}${tab === col.id ? ' is-active' : ''}`}>
              <h4>
                {col.titulo} <span>{cuenta(col.id)}</span>
              </h4>
              {ordenes.filter((o) => o.estado === col.id).length === 0 && <p className="cw-vacio">Sin vehículos</p>}
              {ordenes
                .filter((o) => o.estado === col.id)
                .map((o) => (
                  <article key={o.id} className="cw-orden">
                    <div className="top">
                      <span className="cw-placa">{o.placa}</span>
                      <span className="hora">{o.hora}</span>
                    </div>
                    <div className="det">
                      {catEmoji(o.cat)} {catNombre(o.cat)} · {o.servicio}
                    </div>
                    <button className="cw-btn mini" onClick={() => avanzar(o.id)}>
                      {col.btn}
                    </button>
                  </article>
                ))}
            </section>
          ))}
        </div>

        <div className="cw-dos">
          <div className="cw-card">
            <h3>Ingresos de la semana</h3>
            <div className="cw-barras">
              {SEMANA.map((s) => (
                <div key={s.d} className="barra">
                  <span className="monto">{s.v}</span>
                  <i style={{ height: `${(s.v / max) * 100}%` }} />
                  <span>{s.d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cw-card">
            <h3>Servicios más pedidos</h3>
            {TOP_SERVICIOS.map((s) => (
              <div key={s.n} className="cw-hbar">
                <div className="fila">
                  <span>{s.n}</span>
                  <b>{s.c}</b>
                </div>
                <div className="pista">
                  <i style={{ width: `${(s.c / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
