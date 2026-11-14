import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { useStore, totalOrden } from './store.js'
import { CATEGORIAS, METODOS, soles, hoy, sumarDias, fechaCorta, descargarCSV, catNombre } from './data.js'

export default function Reportes() {
  const { ordenes, egresos } = useStore()
  const [rango, setRango] = useState('semana')
  const [desde, setDesde] = useState(sumarDias(hoy(), -6))
  const [hasta, setHasta] = useState(hoy())
  const [cat, setCat] = useState('todas')
  const [metodo, setMetodo] = useState('todos')

  let d = desde, h = hasta
  if (rango === 'hoy') { d = hoy(); h = hoy() }
  if (rango === 'semana') { d = sumarDias(hoy(), -6); h = hoy() }
  if (rango === 'mes') { d = hoy().slice(0, 8) + '01'; h = hoy() }
  if (rango === 'todo') { d = '0000-01-01'; h = '9999-12-31' }

  const ventas = ordenes
    .filter((o) => o.pagado && o.fechaPago >= d && o.fechaPago <= h && (cat === 'todas' || o.cat === cat))
    .map((o) => {
      const monto = metodo === 'todos' ? totalOrden(o) : o.pagos.filter((p) => p.metodo === metodo).reduce((a, p) => a + p.monto, 0)
      return { o, monto }
    })
    .filter((v) => metodo === 'todos' || v.monto > 0)
    .sort((a, b) => b.o.pagoTs - a.o.pagoTs)

  const ingresos = ventas.reduce((a, v) => a + v.monto, 0)
  const gastos = egresos.filter((g) => g.fecha >= d && g.fecha <= h).reduce((a, g) => a + g.monto, 0)
  const neto = ingresos - gastos
  const pct = ingresos > 0 ? Math.round((neto / ingresos) * 100) : 0

  const porPlaca = {}
  ventas.forEach(({ o, monto }) => {
    const k = o.placa
    porPlaca[k] = porPlaca[k] || { placa: k, nombre: o.cliente?.nombre, visitas: 0, gasto: 0 }
    porPlaca[k].visitas += 1
    porPlaca[k].gasto += monto
  })
  const frecuentes = Object.values(porPlaca).sort((a, b) => b.visitas - a.visitas || b.gasto - a.gasto).slice(0, 8)

  const csv = () =>
    descargarCSV(`reporte-ventas-${d}-${h}.csv`, [
      ['Fecha', 'Ticket', 'Placa', 'Cliente', 'Tipo', 'Detalle', 'Pagos', 'Monto'],
      ...ventas.map(({ o, monto }) => [fechaCorta(o.fechaPago), String(o.numero).padStart(4, '0'), o.placa, o.cliente?.nombre || '', catNombre(o.cat), o.items.map((i) => `${i.cant} ${i.nombre}`).join(' + '), o.pagos.map((p) => `${p.metodo} ${p.monto}`).join(' + '), monto.toFixed(2)]),
      [], ['Ingresos', ingresos.toFixed(2)], ['Gastos', gastos.toFixed(2)], ['Ganancia neta', neto.toFixed(2)],
    ])

  return (
    <>
      <Cabecera titulo="Reportes" subtitulo="Ventas, ganancia y clientes" />
      <div className="cw-content cw-overlap">
        <div className="cw-chips">
          {[['hoy', 'Hoy'], ['semana', '7 días'], ['mes', 'Este mes'], ['todo', 'Todo'], ['otro', 'Fechas']].map(([id, t]) => (
            <button key={id} className={rango === id ? 'active' : ''} onClick={() => setRango(id)}>{t}</button>
          ))}
        </div>

        <div className="cw-card cw-filtros">
          {rango === 'otro' && (
            <div className="cw-fila-dos">
              <label className="cw-campo"><span className="cw-lbl">Desde</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
              <label className="cw-campo"><span className="cw-lbl">Hasta</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
            </div>
          )}
          <div className="cw-fila-dos">
            <label className="cw-campo"><span className="cw-lbl">Tipo de vehículo</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="todas">Todos</option>{CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            </label>
            <label className="cw-campo"><span className="cw-lbl">Método de pago</span>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}><option value="todos">Todos</option>{METODOS.map((m) => <option key={m}>{m}</option>)}</select>
            </label>
          </div>
        </div>

        <div className="cw-kpis tres">
          <div className="cw-kpi destacada"><span className="et">Ganancia neta</span><span className="val">{soles(neto)}</span><span className="pie">{pct}% de los ingresos</span></div>
          <div className="cw-kpi"><span className="et">Ingresos</span><span className="val verde">{soles(ingresos)}</span></div>
          <div className="cw-kpi"><span className="et">Gastos</span><span className="val rojo">{soles(gastos)}</span></div>
        </div>

        <div className="cw-dos">
          <div className="cw-card">
            <h3>Ventas ({ventas.length})</h3>
            {ventas.length === 0 && <p className="cw-vacio">No hay ventas en este período.</p>}
            {ventas.slice(0, 30).map(({ o, monto }) => (
              <div key={o.id} className="cw-fila plano">
                <div className="info"><strong>{o.placa}</strong><div className="cw-meta">{fechaCorta(o.fechaPago)} · {o.items.map((i) => i.nombre).join(', ')}</div></div>
                <b>{soles(monto)}</b>
              </div>
            ))}
          </div>
          <div className="cw-card">
            <h3>Clientes frecuentes</h3>
            {frecuentes.length === 0 && <p className="cw-vacio">Sin datos todavía.</p>}
            {frecuentes.map((c, i) => (
              <div key={c.placa} className="cw-fila plano">
                <span className="cw-rank">{i + 1}</span>
                <div className="info"><strong>{c.placa}</strong><div className="cw-meta">{c.nombre || 'Sin nombre'} · {c.visitas} visitas</div></div>
                <b>{soles(c.gasto)}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="cw-btn-fila no-imprimir">
          <button className="cw-btn ghost" onClick={csv}><Icon name="descargar" /> Descargar Excel (CSV)</button>
          <button className="cw-btn ghost" onClick={() => window.print()}><Icon name="imprimir" /> Imprimir / PDF</button>
        </div>
      </div>
    </>
  )
}
