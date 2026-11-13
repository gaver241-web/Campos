import { useEffect, useState } from 'react'
import { api } from './api.js'
import PageHeader from './PageHeader.jsx'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [ahora, setAhora] = useState(new Date())

  useEffect(() => {
    api.getProductos().then(setProductos).catch(() => {})
    api.getVentas().then(setVentas).catch(() => {})
    const t = setInterval(() => setAhora(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const ventasHoy = ventas.filter(v => (v.fecha || '').slice(0, 10) === hoyISO())
  const totalIngresos = ventasHoy.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const totalProductosVendidos = ventasHoy.reduce((s, v) => s + (Number(v.cantidad) || 0), 0)

  const stockAgua = productos.filter(p => p.categoria === 'agua').reduce((s, p) => s + (Number(p.stock) || 0), 0)
  const stockGas = productos.filter(p => p.categoria === 'gas').reduce((s, p) => s + (Number(p.stock) || 0), 0)

  const ultimas = [...ventas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)

  return (
    <>
      <PageHeader titulo="Venta de Agua y Gas" subtitulo="Resumen del día" ahora={ahora} portada />

      <div className="page-content overlap">
        <div className="metric-grid tres">
          <div className="metric destacada">
            <div className="etiqueta">Ingresos de hoy</div>
            <div className="valor">S/ {totalIngresos.toFixed(2)}</div>
          </div>
          <div className="metric">
            <div className="etiqueta">Ventas</div>
            <div className="valor">{ventasHoy.length}</div>
          </div>
          <div className="metric">
            <div className="etiqueta">Productos vendidos</div>
            <div className="valor">{totalProductosVendidos}</div>
          </div>
        </div>

        <div className="dash-columnas">
          <div>
            <div className="section-title">Stock disponible</div>
            <div className="stock-grid">
              <div className="stock-card agua">
                <div className="emoji">💧</div>
                <div className="titulo">Agua</div>
                <div className="cantidad">{stockAgua}</div>
                <div className="unidad">en inventario</div>
              </div>
              <div className="stock-card gas">
                <div className="emoji">⛽</div>
                <div className="titulo">Balón de gas</div>
                <div className="cantidad">{stockGas}</div>
                <div className="unidad">en inventario</div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">Últimas ventas</div>
            <div className="card">
              {ultimas.length === 0 && <p className="empty">Todavía no hay ventas. Registra la primera en la pestaña Ventas.</p>}
              {ultimas.map(v => (
                <div className="list-item" key={v.id}>
                  <div className="info">
                    <strong>{v.cliente}</strong>
                    <div className="meta">{v.producto} x{v.cantidad}</div>
                  </div>
                  <div className="lado">
                    <div className="monto">S/ {Number(v.montoPagado).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
