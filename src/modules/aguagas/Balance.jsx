import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import PageHeader from './PageHeader.jsx'

function inRange(fechaISO, desde, hasta) {
  const f = new Date(fechaISO)
  return f >= desde && f <= hasta
}

function getRango(filtro, customDesde, customHasta) {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

  if (filtro === 'dia') return [inicioHoy, finHoy]
  if (filtro === 'semana') {
    const inicio = new Date(inicioHoy)
    inicio.setDate(inicio.getDate() - inicio.getDay())
    return [inicio, finHoy]
  }
  if (filtro === 'mes') return [new Date(hoy.getFullYear(), hoy.getMonth(), 1), finHoy]
  if (filtro === 'anio') return [new Date(hoy.getFullYear(), 0, 1), finHoy]
  if (filtro === 'custom' && customDesde && customHasta) {
    return [new Date(customDesde), new Date(customHasta + 'T23:59:59')]
  }
  return [inicioHoy, finHoy]
}

export default function Balance() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [filtro, setFiltro] = useState('dia')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    api.getVentas().then(setVentas).catch(() => {})
    api.getProductos().then(setProductos).catch(() => {})
  }, [])

  const [rInicio, rFin] = getRango(filtro, desde, hasta)
  const ventasFiltradas = useMemo(
    () => ventas.filter(v => v.fecha && inRange(v.fecha, rInicio, rFin)),
    [ventas, filtro, desde, hasta]
  )

  const precioCompraPorId = Object.fromEntries(productos.map(p => [String(p.id), Number(p.precioCompra) || 0]))

  const totalVendido = ventasFiltradas.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const cobradas = ventasFiltradas.filter(v => v.estado === 'Cobrado')
  const pendientes = ventasFiltradas.filter(v => v.estado === 'Por cobrar')
  const totalCobrado = cobradas.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const totalPendiente = pendientes.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const productosVendidos = ventasFiltradas.reduce((s, v) => s + (Number(v.cantidad) || 0), 0)
  const gananciaEstimada = ventasFiltradas.reduce((s, v) => {
    const costo = (precioCompraPorId[String(v.productoId)] || 0) * (Number(v.cantidad) || 0)
    return s + ((Number(v.montoPagado) || 0) - costo)
  }, 0)

  const pctCobrado = totalVendido > 0 ? Math.round((totalCobrado / totalVendido) * 100) : 0

  return (
    <>
      <PageHeader titulo="Balance" subtitulo="Ingresos, ganancia y cobros" compact />

      <div className="filtros-wrap">
        <div className="filtros-fecha">
          {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año'], ['custom', 'Rango']].map(([key, label]) => (
            <button key={key} className={filtro === key ? 'active' : ''} onClick={() => setFiltro(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {filtro === 'custom' && (
          <div className="card">
            <div className="form-grid dos" style={{ marginBottom: 0 }}>
              <div className="form-row">
                <label htmlFor="b-desde">Desde</label>
                <input id="b-desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div className="form-row">
                <label htmlFor="b-hasta">Hasta</label>
                <input id="b-hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="metric-grid cuatro">
          <div className="metric">
            <div className="etiqueta">Total vendido</div>
            <div className="valor">S/ {totalVendido.toFixed(2)}</div>
          </div>
          <div className="metric">
            <div className="etiqueta">Ganancia estimada</div>
            <div className="valor verde">S/ {gananciaEstimada.toFixed(2)}</div>
          </div>
          <div className="metric">
            <div className="etiqueta">Cobrado ({cobradas.length})</div>
            <div className="valor">S/ {totalCobrado.toFixed(2)}</div>
          </div>
          <div className="metric">
            <div className="etiqueta">Por cobrar ({pendientes.length})</div>
            <div className="valor rojo">S/ {totalPendiente.toFixed(2)}</div>
          </div>
        </div>

        <div className="section-title">Estado de cobros</div>
        <div className="card">
          <div className="proporcion" role="img" aria-label={`${pctCobrado}% cobrado`}>
            <span style={{ width: `${pctCobrado}%` }} />
          </div>
          <div className="leyenda">
            <span>Cobrado {pctCobrado}%</span>
            <span>Por cobrar {totalVendido > 0 ? 100 - pctCobrado : 0}%</span>
          </div>
        </div>

        <div className="section-title">Detalle</div>
        <div className="card">
          <div className="list-item">
            <strong>Productos vendidos</strong>
            <span className="monto">{productosVendidos}</span>
          </div>
          <div className="list-item">
            <strong>N° de ventas</strong>
            <span className="monto">{ventasFiltradas.length}</span>
          </div>
        </div>
      </div>
    </>
  )
}
