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

  function handleProductoChange(prodId) {
    const prod = productos.find(p => String(p.id) === String(prodId))
    const cant = Number(form.cantidad) || 1
    const sugerido = prod && prod.precioVenta ? (Number(prod.precioVenta) * cant).toFixed(2) : form.montoPagado
    setForm({ ...form, productoId: prodId, montoPagado: sugerido })
  }

  function handleCantidadChange(nuevaCant) {
    const prod = productos.find(p => String(p.id) === String(form.productoId))
    const cant = Number(nuevaCant) || 1
    const sugerido = prod && prod.precioVenta ? (Number(prod.precioVenta) * cant).toFixed(2) : form.montoPagado
    setForm({ ...form, cantidad: nuevaCant, montoPagado: sugerido })
  }

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
    setForm({
      cliente: v.cliente,
      productoId: v.productoId,
      cantidad: v.cantidad,
      metodoPago: v.metodoPago,
      montoPagado: v.montoPagado,
      estado: v.estado,
    })
    setEditId(v.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelarEdicion() {
    setForm(emptyVenta)
    setEditId(null)
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
          <div>
            <h2>Ventas</h2>
            <p className="header-sub">Registra pedidos y controla cobros</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="two-col-layout">
          <div className="card">
            <div className="card-title">
              <span>{editId ? 'Editar venta' : 'Registrar nueva venta'}</span>
            </div>
            <form onSubmit={guardar}>
              <div className="form-grid">
                <div className="form-row">
                  <label>Cliente</label>
                  <input
                    placeholder="Nombre del cliente"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Producto</label>
                  <select value={form.productoId} onChange={e => handleProductoChange(e.target.value)} required>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid two-cols">
                  <div className="form-row">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={form.cantidad}
                      onChange={e => handleCantidadChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Monto total (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.montoPagado}
                      onChange={e => setForm({ ...form, montoPagado: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-grid two-cols">
                  <div className="form-row">
                    <label>Método de pago</label>
                    <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
                      <option>Efectivo</option>
                      <option>Yape</option>
                      <option>Plin</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Estado del pago</label>
                    <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                      <option value="Cobrado">Cobrado</option>
                      <option value="Por cobrar">Por cobrar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary" type="submit">
                  {editId ? 'Guardar cambios' : 'Registrar venta'}
                </button>
                {editId && (
                  <button type="button" className="btn-secondary" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-title">
              <span>Historial de ventas ({ventas.length})</span>
            </div>
            {ventas.length === 0 && <div className="empty-state">Aún no hay ventas registradas.</div>}
            {ventas.map(v => (
              <div className="list-item" key={v.id}>
                <div className="list-info">
                  <strong>{v.cliente}</strong>
                  <div className="list-meta">
                    {new Date(v.fecha).toLocaleDateString('es-PE')} · {v.producto} (x{v.cantidad}) · {v.metodoPago}
                  </div>
                  <span className={`badge ${v.estado === 'Cobrado' ? 'cobrado' : 'pendiente'}`}>{v.estado}</span>
                </div>
                <div className="list-right">
                  <div className="list-amount">S/ {Number(v.montoPagado).toFixed(2)}</div>
                  <div className="item-actions">
                    <button className="icon-btn" title="Editar" onClick={() => editar(v)}>✏️</button>
                    <button className="icon-btn danger" title="Eliminar" onClick={() => eliminar(v.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
