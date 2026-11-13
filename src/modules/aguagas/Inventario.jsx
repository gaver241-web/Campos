import { useEffect, useState } from 'react'
import { api } from './api.js'

const emptyForm = { nombre: '', categoria: 'agua', stock: '', precioCompra: '', precioVenta: '' }

export default function Inventario() {
  const [tab, setTab] = useState('stock') // stock | compra | historial
  const [productos, setProductos] = useState([])
  const [compras, setCompras] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [compraForm, setCompraForm] = useState({ nombre: '', cantidad: '', precioCompra: '', precioVenta: '' })

  function cargar() {
    api.getProductos().then(setProductos).catch(() => {})
    api.getCompras().then(setCompras).catch(() => {})
  }
  useEffect(cargar, [])

  async function guardarProducto(e) {
    e.preventDefault()
    const data = {
      ...form,
      stock: Number(form.stock) || 0,
      precioCompra: Number(form.precioCompra) || 0,
      precioVenta: Number(form.precioVenta) || 0,
    }
    if (editId) await api.actualizarProducto(editId, data)
    else await api.crearProducto(data)
    setForm(emptyForm)
    setEditId(null)
    cargar()
  }

  function editar(p) {
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      stock: p.stock,
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
    })
    setEditId(p.id)
    setTab('stock')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelarEdicion() {
    setForm(emptyForm)
    setEditId(null)
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
      <header className="module-header">
        <div className="top-row">
          <div>
            <h2>Inventario</h2>
            <p className="header-sub">Gestión de productos, stock y compras</p>
          </div>
        </div>
      </header>

      <div className="tabs-bar">
        <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Stock actual</button>
        <button className={tab === 'compra' ? 'active' : ''} onClick={() => setTab('compra')}>Registrar compra</button>
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>Historial compras</button>
      </div>

      <div className="page-body">
        {tab === 'stock' && (
          <div className="two-col-layout">
            <div className="card">
              <div className="card-title">
                <span>{editId ? 'Editar producto' : 'Nuevo producto'}</span>
              </div>
              <form onSubmit={guardarProducto}>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Nombre del producto</label>
                    <input
                      placeholder="Ej: Bidón Agua 20L"
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Categoría</label>
                    <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      <option value="agua">💧 Agua</option>
                      <option value="gas">⛽ Balón de Gas</option>
                      <option value="otro">📦 Otro</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Stock disponible</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid two-cols">
                    <div className="form-row">
                      <label>Precio compra (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.precioCompra}
                        onChange={e => setForm({ ...form, precioCompra: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <label>Precio venta (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.precioVenta}
                        onChange={e => setForm({ ...form, precioVenta: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-primary" type="submit">
                    {editId ? 'Guardar cambios' : 'Agregar producto'}
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
                <span>Productos registrados ({productos.length})</span>
              </div>
              {productos.length === 0 && <div className="empty-state">Aún no hay productos registrados.</div>}
              {productos.map(p => (
                <div className="list-item" key={p.id}>
                  <div className="list-info">
                    <strong>
                      {p.nombre}
                      <span className="badge cat">{p.categoria === 'agua' ? 'Agua' : p.categoria === 'gas' ? 'Gas' : 'Otro'}</span>
                    </strong>
                    <div className="list-meta">
                      Stock: <b>{p.stock}</b> · Compra: S/ {Number(p.precioCompra || 0).toFixed(2)} · Venta: S/ {Number(p.precioVenta || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="icon-btn" title="Editar" onClick={() => editar(p)}>✏️</button>
                    <button className="icon-btn danger" title="Eliminar" onClick={() => eliminar(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'compra' && (
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-title">
              <span>Registrar ingreso de mercadería</span>
            </div>
            <form onSubmit={registrarCompra}>
              <div className="form-grid">
                <div className="form-row">
                  <label>Nombre del producto</label>
                  <input
                    value={compraForm.nombre}
                    onChange={e => setCompraForm({ ...compraForm, nombre: e.target.value })}
                    required
                    placeholder="Ej: Balón de Gas 10kg"
                  />
                </div>
                <div className="form-row">
                  <label>Cantidad comprada</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={compraForm.cantidad}
                    onChange={e => setCompraForm({ ...compraForm, cantidad: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grid two-cols">
                  <div className="form-row">
                    <label>Precio de compra (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={compraForm.precioCompra}
                      onChange={e => setCompraForm({ ...compraForm, precioCompra: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Precio de venta (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={compraForm.precioVenta}
                      onChange={e => setCompraForm({ ...compraForm, precioVenta: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-amarillo" type="submit">Registrar compra</button>
              </div>
            </form>
            <p style={{ fontSize: 13, color: 'var(--gris-texto)', marginTop: 14, marginBottom: 0 }}>
              Si el producto ya existe con el mismo nombre, se sumará la cantidad al stock actual. Si no existe, se creará automáticamente.
            </p>
          </div>
        )}

        {tab === 'historial' && (
          <div className="card">
            <div className="card-title">
              <span>Historial de compras ({compras.length})</span>
            </div>
            {compras.length === 0 && <div className="empty-state">Aún no hay compras registradas.</div>}
            {compras.map(c => (
              <div className="list-item" key={c.id}>
                <div className="list-info">
                  <strong>{c.nombre}</strong>
                  <div className="list-meta">
                    {new Date(c.fecha).toLocaleDateString('es-PE')} · Cantidad: {c.cantidad} unid. · Unit: S/ {Number(c.precioCompra).toFixed(2)}
                  </div>
                </div>
                <div className="list-right">
                  <span className="list-amount">S/ {(c.cantidad * c.precioCompra).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
