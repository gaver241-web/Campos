import { useEffect, useState } from 'react'
import { api } from './api.js'

const emptyVenta = { cliente: '', productoId: '', cantidad: 1, metodoPago: 'Efectivo', montoPagado: '', estado: 'Cobrado' }

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [form, setForm] = useState(emptyVenta)
  const [editId, setEditId] = useState(null)

  function cargar() {
    api.getProductos().then(setProductos).catch(() => {})
    api.getVentas().then(v => setVentas(v.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))).catch(() => {})
  }
  useEffect(cargar, [])

  async function guardar(e) {
    e.preventDefault()
    const producto = productos.find(p => String(p.id) === String(form.productoId))
    const data = {
      cliente: form.cliente,
      productoId: form.productoId,
      producto: producto ? producto.nombre : '',
      cantidad: Number(form.cantidad) || 1,
      metodoPago: form.metodoPago,
      montoPagado: Number(form.montoPagado) || 0,
      estado: form.estado,
      fecha: new Date().toISOString(),
    }
    if (editId) await api.actualizarVenta(editId, data)
    else await api.crearVenta(data)
    setForm(emptyVenta)
    setEditId(null)
    cargar()
  }

  function editar(v) {
    setForm({ cliente: v.cliente, productoId: v.productoId, cantidad: v.cantidad, metodoPago: v.metodoPago, montoPagado: v.montoPagado, estado: v.estado })
    setEditId(v.id)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta venta?')) return
    await api.eliminarVenta(id)
    cargar()
  }

  return (
    <>
      <header className="module-header">
        <div className="top-row">
          <h2>Ventas</h2>
        </div>
      </header>

      <div className="page-content">
        <div className="card">
          <form onSubmit={guardar}>
            <div className="form-row">
              <label>Cliente</label>
              <input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Producto</label>
              <select value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Cantidad</label>
              <input type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Método de pago</label>
              <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
                <option>Efectivo</option>
                <option>Yape</option>
                <option>Plin</option>
              </select>
            </div>
            <div className="form-row">
              <label>Monto pagado (S/)</label>
              <input type="number" step="0.01" value={form.montoPagado} onChange={e => setForm({ ...form, montoPagado: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Estado del pago</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="Cobrado">Cobrado</option>
                <option value="Por cobrar">Por cobrar</option>
              </select>
            </div>
            <button className="btn-primary" type="submit">{editId ? 'Guardar cambios' : 'Registrar venta'}</button>
          </form>
        </div>

        <div className="section-title" style={{ margin: '4px 0 8px' }}>Historial de ventas</div>
        <div className="card">
          {ventas.length === 0 && <p style={{ color: '#6B8494', fontSize: 14 }}>Aún no hay ventas registradas.</p>}
          {ventas.map(v => (
            <div className="list-item" key={v.id}>
              <div>
                <strong>{v.cliente}</strong>
                <div style={{ fontSize: 12, color: '#6B8494' }}>
                  {new Date(v.fecha).toLocaleDateString('es-PE')} · {v.producto} x{v.cantidad} · {v.metodoPago}
                </div>
                <span className={`badge ${v.estado === 'Cobrado' ? 'cobrado' : 'pendiente'}`}>{v.estado}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>S/ {Number(v.montoPagado).toFixed(2)}</div>
                <div>
                  <button className="icon-btn" onClick={() => editar(v)}>✏️</button>
                  <button className="icon-btn" onClick={() => eliminar(v.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
