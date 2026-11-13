import { useEffect, useState } from 'react'
import { api } from './api.js'
import PageHeader from './PageHeader.jsx'

const emptyForm = { nombre: '', categoria: 'agua', stock: '', precioCompra: '', precioVenta: '' }

export default function Inventario() {
  const [tab, setTab] = useState('stock') // stock | compra | historial
  const [productos, setProductos] = useState([])
  const [compras, setCompras] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [formAbierto, setFormAbierto] = useState(false) // solo afecta al celular
  const [compraForm, setCompraForm] = useState({ nombre: '', cantidad: '', precioCompra: '', precioVenta: '' })

  function cargar() {
    api.getProductos().then(setProductos).catch(() => {})
    api.getCompras().then(setCompras).catch(() => {})
  }
  useEffect(cargar, [])

  function cerrarForm() {
    setForm(emptyForm)
    setEditId(null)
    setFormAbierto(false)
  }

  async function guardarProducto(e) {
    e.preventDefault()
    const data = { ...form, stock: Number(form.stock) || 0, precioCompra: Number(form.precioCompra) || 0, precioVenta: Number(form.precioVenta) || 0 }
    if (editId) await api.actualizarProducto(editId, data)
    else await api.crearProducto(data)
    cerrarForm()
    cargar()
  }

  function editar(p) {
    setForm({ nombre: p.nombre, categoria: p.categoria, stock: p.stock, precioCompra: p.precioCompra, precioVenta: p.precioVenta })
    setEditId(p.id)
    setTab('stock')
    setFormAbierto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await api.eliminarProducto(id)
    cargar()
  }

  async function registrarCompra(e) {
    e.preventDefault()
    await api.registrarCompra({
      nombre: compraForm.nombre,
      cantidad: Number(compraForm.cantidad) || 0,
      precioCompra: Number(compraForm.precioCompra) || 0,
      precioVenta: Number(compraForm.precioVenta) || 0,
      fecha: new Date().toISOString(),
    })
    setCompraForm({ nombre: '', cantidad: '', precioCompra: '', precioVenta: '' })
    cargar()
  }

  return (
    <>
      <PageHeader titulo="Inventario" subtitulo="Productos, compras y stock" compact />

      <div className="filtros-wrap">
        <div className="filtros-fecha">
          <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Stock</button>
          <button className={tab === 'compra' ? 'active' : ''} onClick={() => setTab('compra')}>Registrar compra</button>
          <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>Historial</button>
        </div>
      </div>

      <div className="page-content">
        {tab === 'stock' && (
          <div className="split invertido">
            <section className={`pane pane-lista${!formAbierto ? ' is-active' : ''}`}>
              <button className="btn-primary solo-movil" style={{ marginBottom: 16 }} onClick={() => setFormAbierto(true)}>
                + Agregar producto
              </button>
              <div className="card">
                <h3>Productos ({productos.length})</h3>
                {productos.length === 0 && <p className="empty">Aún no hay productos. Agrega el primero.</p>}
                {productos.map(p => (
                  <div className="list-item" key={p.id}>
                    <div className="info">
                      <strong>{p.nombre}</strong>
                      <div className="meta">
                        Stock: {p.stock}
                        <br />
                        Venta S/ {Number(p.precioVenta).toFixed(2)}
                      </div>
                    </div>
                    <div className="acciones">
                      <button className="icon-btn" aria-label="Editar producto" onClick={() => editar(p)}>✏️</button>
                      <button className="icon-btn" aria-label="Eliminar producto" onClick={() => eliminar(p.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`pane pane-form${formAbierto ? ' is-active' : ''}`}>
              <div className="card">
                <h3>{editId ? 'Editar producto' : 'Nuevo producto'}</h3>
                <form onSubmit={guardarProducto}>
                  <div className="form-grid">
                    <div className="form-row">
                      <label htmlFor="p-nombre">Nombre del producto</label>
                      <input id="p-nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                    </div>
                    <div className="form-grid dos" style={{ marginBottom: 0 }}>
                      <div className="form-row">
                        <label htmlFor="p-categoria">Categoría</label>
                        <select id="p-categoria" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                          <option value="agua">Agua</option>
                          <option value="gas">Balón de Gas</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div className="form-row">
                        <label htmlFor="p-stock">Stock disponible</label>
                        <input id="p-stock" type="number" inputMode="numeric" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-grid dos" style={{ marginBottom: 0 }}>
                      <div className="form-row">
                        <label htmlFor="p-compra">Precio de compra (S/)</label>
                        <input id="p-compra" type="number" inputMode="decimal" step="0.01" value={form.precioCompra} onChange={e => setForm({ ...form, precioCompra: e.target.value })} />
                      </div>
                      <div className="form-row">
                        <label htmlFor="p-venta">Precio de venta (S/)</label>
                        <input id="p-venta" type="number" inputMode="decimal" step="0.01" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="btn-row">
                    <button className="btn-primary" type="submit">{editId ? 'Guardar cambios' : 'Agregar producto'}</button>
                    <button className="btn-secondary" type="button" onClick={cerrarForm}>Cancelar</button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}

        {tab === 'compra' && (
          <div className="card angosta">
            <h3>Registrar compra</h3>
            <form onSubmit={registrarCompra}>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="c-nombre">Nombre del producto</label>
                  <input id="c-nombre" value={compraForm.nombre} onChange={e => setCompraForm({ ...compraForm, nombre: e.target.value })} required placeholder="Ej: Balón de Gas 10kg" />
                </div>
                <div className="form-row">
                  <label htmlFor="c-cantidad">Cantidad comprada</label>
                  <input id="c-cantidad" type="number" inputMode="numeric" value={compraForm.cantidad} onChange={e => setCompraForm({ ...compraForm, cantidad: e.target.value })} required />
                </div>
                <div className="form-grid dos" style={{ marginBottom: 0 }}>
                  <div className="form-row">
                    <label htmlFor="c-pcompra">Precio de compra (S/)</label>
                    <input id="c-pcompra" type="number" inputMode="decimal" step="0.01" value={compraForm.precioCompra} onChange={e => setCompraForm({ ...compraForm, precioCompra: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label htmlFor="c-pventa">Precio de venta (S/)</label>
                    <input id="c-pventa" type="number" inputMode="decimal" step="0.01" value={compraForm.precioVenta} onChange={e => setCompraForm({ ...compraForm, precioVenta: e.target.value })} required />
                  </div>
                </div>
              </div>
              <button className="btn-amarillo" type="submit">Registrar compra</button>
            </form>
            <p className="form-hint">
              Si el producto ya existe (mismo nombre), se suma la cantidad al stock. Si no existe, se crea automáticamente.
            </p>
          </div>
        )}

        {tab === 'historial' && (
          <div className="card">
            <h3>Historial de compras</h3>
            {compras.length === 0 && <p className="empty">Aún no hay compras registradas.</p>}
            {compras.map(c => (
              <div className="list-item" key={c.id}>
                <div className="info">
                  <strong>{c.nombre}</strong>
                  <div className="meta">
                    {new Date(c.fecha).toLocaleDateString('es-PE')} · Cant: {c.cantidad}
                  </div>
                </div>
                <div className="monto">S/ {(c.cantidad * c.precioCompra).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
