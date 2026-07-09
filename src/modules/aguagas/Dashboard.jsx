import { useEffect, useState } from 'react'
import { api } from './api.js'

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

  return (
    <>
      <header className="module-header">
        <div className="top-row">
          <h2>Venta de Agua y Gas</h2>
          <div className="datetime">
            <div>{ahora.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div>{ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </header>

      <div className="section-title">Resumen del día</div>
      <div className="resumen-grid">
        <div className="resumen-card">
          <div className="valor">S/ {totalIngresos.toFixed(2)}</div>
          <div className="etiqueta">Ingresos</div>
        </div>
        <div className="resumen-card">
          <div className="valor">{ventasHoy.length}</div>
          <div className="etiqueta">Ventas</div>
        </div>
        <div className="resumen-card">
          <div className="valor">{totalProductosVendidos}</div>
          <div className="etiqueta">Productos</div>
        </div>
      </div>

      <div className="section-title">Stock rápido</div>
      <div className="stock-grid">
        <div className="stock-card agua">
          <div className="emoji">💧</div>
          <div className="titulo">Agua</div>
          <div className="cantidad">{stockAgua}</div>
        </div>
        <div className="stock-card gas">
          <div className="emoji">⛽</div>
          <div className="titulo">Balón de Gas</div>
          <div className="cantidad">{stockGas}</div>
        </div>
      </div>
    </>
  )
}
