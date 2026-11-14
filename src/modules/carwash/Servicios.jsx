import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { Modal, Campo, BotonesFila, confirmar, PreciosCategoria, limpiarPrecios } from './Ui.jsx'
import { useStore, acc } from './store.js'
import { CATEGORIAS, soles } from './data.js'

function FormPrecio({ titulo, inicial, conDetalle, onClose, col }) {
  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [detalle, setDetalle] = useState(inicial?.detalle || '')
  const [precios, setPrecios] = useState(inicial?.precios || {})
  const guardar = () => {
    if (!nombre.trim()) return
    acc.guardar(col, { ...inicial, nombre: nombre.trim(), ...(conDetalle ? { detalle: detalle.trim() } : {}), precios: limpiarPrecios(precios) })
    onClose()
  }
  return (
    <Modal titulo={titulo} onClose={onClose}>
      <Campo label="Nombre"><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Lavado completo" autoFocus /></Campo>
      {conDetalle && <Campo label="Qué incluye"><input value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej. Lavado completo + Encerado" /></Campo>}
      <h4 className="cw-sub">Precio por tipo de vehículo</h4>
      <PreciosCategoria precios={precios} setPrecios={setPrecios} />
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

function FormProducto({ inicial, onClose }) {
  const [f, setF] = useState({ nombre: '', tipo: 'Venta', precio: '', stock: '', minimo: '', ...inicial })
  const set = (k, v) => setF({ ...f, [k]: v })
  const guardar = () => {
    if (!f.nombre.trim()) return
    acc.guardar('productos', { ...f, nombre: f.nombre.trim(), precio: f.tipo === 'Venta' ? Number(f.precio) || 0 : 0, stock: Number(f.stock) || 0, minimo: Number(f.minimo) || 0 })
    onClose()
  }
  return (
    <Modal titulo={inicial ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <Campo label="Nombre"><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Ambientador" autoFocus /></Campo>
      <Campo label="Tipo">
        <select value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
          <option value="Venta">Venta directa (se cobra al cliente)</option>
          <option value="Insumo">Insumo del local (no se vende)</option>
        </select>
      </Campo>
      {f.tipo === 'Venta' && (
        <Campo label="Precio de venta (S/)"><input type="number" inputMode="decimal" min="0" step="0.01" value={f.precio} onChange={(e) => set('precio', e.target.value)} /></Campo>
      )}
      <div className="cw-fila-dos">
        <Campo label="Stock actual"><input type="number" inputMode="numeric" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} /></Campo>
        <Campo label="Avisar si baja de"><input type="number" inputMode="numeric" min="0" value={f.minimo} onChange={(e) => set('minimo', e.target.value)} /></Campo>
      </div>
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

export default function Servicios() {
  const { servicios, combos, productos } = useStore()
  const [tab, setTab] = useState('servicios')
  const [form, setForm] = useState(null)

  const borrar = (col, item, txt) => confirmar(`¿Borrar ${txt} "${item.nombre}"?`) && acc.borrar(col, item.id)

  return (
    <>
      <Cabecera titulo="Servicios y tarifas" subtitulo="Todo se puede editar o borrar" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          {[['servicios', 'Servicios'], ['combos', 'Combos'], ['inventario', 'Inventario']].map(([id, t]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t}</button>
          ))}
        </div>

        {tab === 'servicios' && (
          <div className="cw-card">
            {servicios.length === 0 ? (
              <div className="cw-vacio-grande">
                <p>Todavía no hay servicios.</p>
                <p className="cw-nota">Crea el primero (por ejemplo "Lavado completo") y ponle precio para cada tipo de vehículo.</p>
              </div>
            ) : (
              <div className="cw-tabla-wrap">
                <table className="cw-tabla">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      {CATEGORIAS.map((c) => <th key={c.id}>{c.emoji}<br />{c.corto}</th>)}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map((s) => (
                      <tr key={s.id}>
                        <td>{s.nombre}</td>
                        {CATEGORIAS.map((c) => <td key={c.id}>{Number(s.precios?.[c.id]) > 0 ? s.precios[c.id] : '—'}</td>)}
                        <td><BotonesFila onEditar={() => setForm({ tipo: 'servicio', item: s })} onBorrar={() => borrar('servicios', s, 'el servicio')} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="cw-btn" onClick={() => setForm({ tipo: 'servicio' })}>+ Nuevo servicio</button>
          </div>
        )}

        {tab === 'combos' && (
          <div className="cw-card">
            {combos.length === 0 && (
              <div className="cw-vacio-grande">
                <p>Todavía no hay combos.</p>
                <p className="cw-nota">Un combo junta varios servicios con un precio promocional.</p>
              </div>
            )}
            {combos.map((c) => (
              <div key={c.id} className="cw-fila plano">
                <div className="info">
                  <strong>{c.nombre}</strong>
                  <div className="cw-meta">{c.detalle || 'Sin detalle'}</div>
                  <div className="cw-meta">{CATEGORIAS.filter((k) => Number(c.precios?.[k.id]) > 0).map((k) => `${k.corto} ${soles(c.precios[k.id])}`).join(' · ') || 'Sin precios'}</div>
                </div>
                <BotonesFila onEditar={() => setForm({ tipo: 'combo', item: c })} onBorrar={() => borrar('combos', c, 'el combo')} />
              </div>
            ))}
            <button className="cw-btn" onClick={() => setForm({ tipo: 'combo' })}>+ Nuevo combo</button>
          </div>
        )}

        {tab === 'inventario' && (
          <div className="cw-card">
            {productos.length === 0 && (
              <div className="cw-vacio-grande">
                <p>El inventario está vacío.</p>
                <p className="cw-nota">Agrega productos de venta (ambientadores, siliconas, bebidas) e insumos (shampoo, cera).</p>
              </div>
            )}
            {productos.map((p) => {
              const bajo = Number(p.stock) < Number(p.minimo)
              return (
                <div key={p.id} className="cw-fila plano">
                  <div className="info">
                    <strong>{p.nombre}</strong>
                    <div className="cw-meta">{p.tipo}{p.tipo === 'Venta' ? ` · ${soles(p.precio)}` : ''} · avisar bajo {p.minimo}</div>
                    {bajo && <span className="cw-chip rojo">Stock bajo</span>}
                  </div>
                  <div className="lado">
                    <div className="cw-stock-ctl">
                      <button onClick={() => acc.ajustarStock(p.id, -1)} aria-label="Restar">−</button>
                      <b className={bajo ? 'rojo' : ''}>{p.stock}</b>
                      <button onClick={() => acc.ajustarStock(p.id, 1)} aria-label="Sumar">+</button>
                    </div>
                    <BotonesFila onEditar={() => setForm({ tipo: 'producto', item: p })} onBorrar={() => borrar('productos', p, 'el producto')} />
                  </div>
                </div>
              )
            })}
            <button className="cw-btn" onClick={() => setForm({ tipo: 'producto' })}>+ Nuevo producto</button>
          </div>
        )}
      </div>

      {form?.tipo === 'servicio' && <FormPrecio col="servicios" titulo={form.item ? 'Editar servicio' : 'Nuevo servicio'} inicial={form.item} onClose={() => setForm(null)} />}
      {form?.tipo === 'combo' && <FormPrecio col="combos" conDetalle titulo={form.item ? 'Editar combo' : 'Nuevo combo'} inicial={form.item} onClose={() => setForm(null)} />}
      {form?.tipo === 'producto' && <FormProducto inicial={form.item} onClose={() => setForm(null)} />}
    </>
  )
}
