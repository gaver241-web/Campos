import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { SEMANA, CLIENTES, soles } from './data.js'

const RANGOS = ['Hoy', 'Semana', 'Mes', 'Personalizado']

export default function Reportes() {
  const [rango, setRango] = useState('Semana')
  const ingresos = SEMANA.reduce((a, s) => a + s.v, 0)
  const egresos = 780
  const neto = ingresos - egresos
  const pct = Math.round((neto / ingresos) * 100)
  const frecuentes = [...CLIENTES].sort((a, b) => b.gasto - a.gasto).slice(0, 5)

  return (
    <>
      <Cabecera titulo="Reportes" subtitulo="Ventas, ganancia y clientes" />
      <div className="cw-content cw-overlap">
        <div className="cw-chips">
          {RANGOS.map((r) => <button key={r} className={rango === r ? 'active' : ''} onClick={() => setRango(r)}>{r}</button>)}
        </div>

        <div className="cw-kpis tres">
          <div className="cw-kpi destacada"><span className="et">Ganancia neta</span><span className="val">{soles(neto)}</span><span className="pie">{pct}% de los ingresos</span></div>
          <div className="cw-kpi"><span className="et">Ingresos</span><span className="val verde">{soles(ingresos)}</span></div>
          <div className="cw-kpi"><span className="et">Egresos</span><span className="val rojo">{soles(egresos)}</span></div>
        </div>

        <div className="cw-card">
          <h3>Ingresos vs. egresos</h3>
          <div className="cw-prop"><span style={{ width: `${(ingresos / (ingresos + egresos)) * 100}%` }} /></div>
          <div className="cw-leyenda"><span>Ingresos {soles(ingresos)}</span><span>Egresos {soles(egresos)}</span></div>
        </div>

        <div className="cw-card">
          <h3>Clientes frecuentes</h3>
          {frecuentes.map((c, i) => (
            <div key={c.id} className="cw-fila plano">
              <span className="cw-rank">{i + 1}</span>
              <div className="info"><strong>{c.placas[0]}</strong><div className="cw-meta">{c.nombre} · {c.visitas} visitas</div></div>
              <b>{soles(c.gasto)}</b>
            </div>
          ))}
        </div>

        <div className="cw-btn-fila">
          <button className="cw-btn ghost"><Icon name="descargar" /> Descargar Excel</button>
          <button className="cw-btn ghost"><Icon name="descargar" /> Descargar PDF</button>
        </div>
      </div>
    </>
  )
}
