import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'

function hoyISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export default function Dashboard() {
  const navigate = useNavigate()
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

  return (
    <>
      <header className="module-header">
        <div className="top-row">
          <div>
            <h2>Venta de Agua y Gas</h2>
            <p className="header-sub">Panel general del día</p>
          </div>
          <div className="datetime">
            <div>{ahora.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div>{ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="section-header">
          <h3 className="section-title">Resumen de hoy</h3>
        </div>
        <div className="resumen-grid">
          <div className="resumen-card highlight">
            <div className="valor">S/ {totalIngresos.toFixed(2)}</div>
            <div className="etiqueta">Ingresos</div>
          </div>
          <div className="resumen-card">
            <div className="valor">{ventasHoy.length}</div>
            <div className="etiqueta">Ventas</div>
          </div>
          <div className="resumen-card">
            <div className="valor">{totalProductosVendidos}</div>
            <div className="etiqueta">Unidades</div>
          </div>
        </div>

        <div className="section-header">
          <h3 className="section-title">Stock disponible</h3>
        </div>
        <div className="stock-grid">
          <div className="stock-card agua">
            <div className="stock-card-top">
              <div className="emoji">💧</div>
            </div>
            <div>
              <div className="titulo">Agua</div>
              <div className="cantidad">{stockAgua}</div>
              <div className="unidad">unidades en stock</div>
            </div>
          </div>

          <div className="stock-card gas">
            <div className="stock-card-top">
              <div className="emoji">⛽</div>
            </div>
            <div>
              <div className="titulo">Balón de Gas</div>
              <div className="cantidad">{stockGas}</div>
              <div className="unidad">balones en stock</div>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3 className="section-title">Accesos rápidos</h3>
        </div>
        <div className="quick-actions">
          <button className="quick-btn" onClick={() => navigate('/agua-gas/ventas')}>
            <span>➕</span>
            <span>Nueva venta</span>
          </button>
          <button className="quick-btn" onClick={() => navigate('/agua-gas/inventario')}>
            <span>📦</span>
            <span>Ver inventario</span>
          </button>
        </div>
      </div>
    </>
  )
}
