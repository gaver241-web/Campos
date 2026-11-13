import { useEffect, useState } from 'react'
import { api } from './api.js'
import PageHeader from './PageHeader.jsx'

const emptyVenta = { cliente: '', productoId: '', cantidad: 1, metodoPago: 'Efectivo', montoPagado: '', estado: 'Cobrado' }

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [form, setForm] = useState(emptyVenta)
  const [editId, setEditId] = useState(null)
  const [vista, setVista] = useState('nueva') // solo afecta al celular: nueva | historial

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
    setVista('historial')
    cargar()
  }

  function editar(v) {
    setForm({ cliente: v.cliente, productoId: v.productoId, cantidad: v.cantidad, metodoPago: v.metodoPago, montoPagado: v.montoPagado, estado: v.estado })
    setEditId(v.id)
    setVista('nueva')
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
      <PageHeader titulo="Ventas" subtitulo="Registra y revisa tus ventas" compact />

      <div className="page-content">
        <div className="segmented">
          <button className={vista === 'nueva' ? 'active' : ''} onClick={() => setVista('nueva')}>
            {editId ? 'Editar venta' : 'Nueva venta'}
          </button>
          <button className={vista === 'historial' ? 'active' : ''} onClick={() => setVista('historial')}>
            Historial ({ventas.length})
          </button>
        </div>

        <div className="split">
          <section className={`pane pane-form${vista === 'nueva' ? ' is-active' : ''}`}>
            <div className="card">
              <h3>{editId ? 'Editar venta' : 'Nueva venta'}</h3>
              <form onSubmit={guardar}>
                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="v-cliente">Cliente</label>
                    <input id="v-cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label htmlFor="v-producto">Producto</label>
                    <select id="v-producto" value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} required>
                      <option value="">Seleccionar...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="form-grid dos" style={{ marginBottom: 0 }}>
                    <div className="form-row">
                      <label htmlFor="v-cantidad">Cantidad</label>
                      <input id="v-cantidad" type="number" inputMode="numeric" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} required />
                    </div>
                    <div className="form-row">
                      <label htmlFor="v-monto">Monto pagado (S/)</label>
                      <input id="v-monto" type="number" inputMode="decimal" step="0.01" value={form.montoPagado} onChange={e => setForm({ ...form, montoPagado: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-grid dos" style={{ marginBottom: 0 }}>
                    <div className="form-row">
                      <label htmlFor="v-metodo">Método de pago</label>
                      <select id="v-metodo" value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
                        <option>Efectivo</option>
                        <option>Yape</option>
                        <option>Plin</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label htmlFor="v-estado">Estado del pago</label>
                      <select id="v-estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                        <option value="Cobrado">Cobrado</option>
                        <option value="Por cobrar">Por cobrar</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="btn-row">
                  <button className="btn-primary" type="submit">{editId ? 'Guardar cambios' : 'Registrar venta'}</button>
                  {editId && <button className="btn-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}
                </div>
              </form>
            </div>
          </section>

          <section className={`pane pane-lista${vista === 'historial' ? ' is-active' : ''}`}>
            <div className="card">
              <h3>Historial de ventas</h3>
              {ventas.length === 0 && <p className="empty">Todavía no hay ventas registradas.</p>}
              {ventas.map(v => (
                <div className="list-item" key={v.id}>
                  <div className="info">
                    <strong>{v.cliente}</strong>
                    <div className="meta">
                      {v.producto} x{v.cantidad}
                      <br />
                      {new Date(v.fecha).toLocaleDateString('es-PE')} · {v.metodoPago}
                    </div>
                    <span className={`badge ${v.estado === 'Cobrado' ? 'cobrado' : 'pendiente'}`}>{v.estado}</span>
                  </div>
                  <div className="lado">
                    <div className="monto">S/ {Number(v.montoPagado).toFixed(2)}</div>
                    <div className="acciones">
                      <button className="icon-btn" aria-label="Editar venta" onClick={() => editar(v)}>✏️</button>
                      <button className="icon-btn" aria-label="Eliminar venta" onClick={() => eliminar(v.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
