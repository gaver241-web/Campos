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
    const data = { ...form, stock: Number(form.stock) || 0, precioCompra: Number(form.precioCompra) || 0, precioVenta: Number(form.precioVenta) || 0 }
    if (editId) await api.actualizarProducto(editId, data)
    else await api.crearProducto(data)
    setForm(emptyForm)
    setEditId(null)
    cargar()
  }

  function editar(p) {
    setForm({ nombre: p.nombre, categoria: p.categoria, stock: p.stock, precioCompra: p.precioCompra, precioVenta: p.precioVenta })
    setEditId(p.id)
    setTab('stock')
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
          <h2>Inventario</h2>
        </div>
      </header>

      <div className="filtros-fecha">
        <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Stock</button>
        <button className={tab === 'compra' ? 'active' : ''} onClick={() => setTab('compra')}>Registrar compra</button>
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>Historial</button>
      </div>

      <div className="page-content">
        {tab === 'stock' && (
          <>
            <div className="card">
              <form onSubmit={guardarProducto}>
                <div className="form-row">
                  <label>Nombre del producto</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    <option value="agua">Agua</option>
                    <option value="gas">Balón de Gas</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Stock disponible</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Precio de compra (S/)</label>
                  <input type="number" step="0.01" value={form.precioCompra} onChange={e => setForm({ ...form, precioCompra: e.target.value })} />
                </div>
                <div className="form-row">
                  <label>Precio de venta (S/)</label>
                  <input type="number" step="0.01" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} />
                </div>
                <button className="btn-primary" type="submit">{editId ? 'Guardar cambios' : 'Agregar producto'}</button>
              </form>
            </div>

            <div className="card">
              {productos.length === 0 && <p style={{ color: '#6B8494', fontSize: 14 }}>Aún no hay productos.</p>}
              {productos.map(p => (
                <div className="list-item" key={p.id}>
                  <div>
                    <strong>{p.nombre}</strong>
                    <div style={{ fontSize: 12, color: '#6B8494' }}>Stock: {p.stock} · Venta S/ {Number(p.precioVenta).toFixed(2)}</div>
                  </div>
                  <div>
                    <button className="icon-btn" onClick={() => editar(p)}>✏️</button>
                    <button className="icon-btn" onClick={() => eliminar(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'compra' && (
          <div className="card">
            <form onSubmit={registrarCompra}>
              <div className="form-row">
                <label>Nombre del producto</label>
                <input value={compraForm.nombre} onChange={e => setCompraForm({ ...compraForm, nombre: e.target.value })} required placeholder="Ej: Balón de Gas 10kg" />
              </div>
              <div className="form-row">
                <label>Cantidad comprada</label>
                <input type="number" value={compraForm.cantidad} onChange={e => setCompraForm({ ...compraForm, cantidad: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Precio de compra (S/)</label>
                <input type="number" step="0.01" value={compraForm.precioCompra} onChange={e => setCompraForm({ ...compraForm, precioCompra: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Precio de venta (S/)</label>
                <input type="number" step="0.01" value={compraForm.precioVenta} onChange={e => setCompraForm({ ...compraForm, precioVenta: e.target.value })} required />
              </div>
              <button className="btn-amarillo" type="submit" style={{ width: '100%' }}>Registrar compra</button>
            </form>
            <p style={{ fontSize: 12, color: '#6B8494', marginTop: 10 }}>
              Si el producto ya existe (mismo nombre), se suma la cantidad al stock. Si no existe, se crea automáticamente.
            </p>
          </div>
        )}

        {tab === 'historial' && (
          <div className="card">
            {compras.length === 0 && <p style={{ color: '#6B8494', fontSize: 14 }}>Aún no hay compras registradas.</p>}
            {compras.map(c => (
              <div className="list-item" key={c.id}>
                <div>
                  <strong>{c.nombre}</strong>
                  <div style={{ fontSize: 12, color: '#6B8494' }}>
                    {new Date(c.fecha).toLocaleDateString('es-PE')} · Cant: {c.cantidad}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>S/ {(c.cantidad * c.precioCompra).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
