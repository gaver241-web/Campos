import { useState } from 'react'
import Icon from './Icons.jsx'
import { useStore, subtotalItems } from './store.js'
import { soles, uid } from './data.js'

// Lista de líneas del ticket + selector de servicios, combos, productos y extras. Todo editable.
export default function EditorItems({ items, setItems, cat, descuento, setDescuento, aplicarGratis }) {
  const { servicios, combos, productos } = useStore()
  const [tab, setTab] = useState('servicio')
  const [extra, setExtra] = useState({ nombre: '', precio: '' })

  const agregar = (linea) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => linea.refId && x.refId === linea.refId && x.tipo === linea.tipo)
      if (i >= 0) return prev.map((x, k) => (k === i ? { ...x, cant: Number(x.cant) + 1 } : x))
      return [...prev, { ...linea, key: uid(), cant: 1 }]
    })
  const cambiar = (key, patch) => setItems((prev) => prev.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const quitar = (key) => setItems((prev) => prev.filter((x) => x.key !== key))

  const sub = subtotalItems(items)
  const total = Math.max(0, sub - Number(descuento || 0))

  const catalogo = {
    servicio: servicios.filter((s) => Number(s.precios?.[cat]) > 0).map((s) => ({ tipo: 'servicio', refId: s.id, nombre: s.nombre, precio: Number(s.precios[cat]) })),
    combo: combos.filter((c) => Number(c.precios?.[cat]) > 0).map((c) => ({ tipo: 'combo', refId: c.id, nombre: c.nombre, precio: Number(c.precios[cat]) })),
    producto: productos.filter((p) => p.tipo === 'Venta').map((p) => ({ tipo: 'producto', refId: p.id, nombre: p.nombre, precio: Number(p.precio) || 0, stock: p.stock })),
  }
  const vacios = {
    servicio: 'Aún no hay servicios para este tipo de vehículo. Créalos en Servicios y tarifas.',
    combo: 'Aún no hay combos para este tipo de vehículo.',
    producto: 'Aún no hay productos de venta en el inventario.',
  }

  const agregarExtra = () => {
    if (!extra.nombre.trim()) return
    agregar({ tipo: 'extra', refId: '', nombre: extra.nombre.trim(), precio: Number(extra.precio) || 0 })
    setExtra({ nombre: '', precio: '' })
  }

  return (
    <div className="cw-editor">
      <div className="cw-segmented chico">
        {[['servicio', 'Servicios'], ['combo', 'Combos'], ['producto', 'Productos'], ['extra', 'Extra']].map(([id, t]) => (
          <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t}</button>
        ))}
      </div>

      {tab !== 'extra' ? (
        <div className="cw-catalogo">
          {catalogo[tab].length === 0 && <p className="cw-vacio">{vacios[tab]}</p>}
          {catalogo[tab].map((l) => (
            <button type="button" key={l.refId} className="cw-cat-item" onClick={() => agregar(l)}>
              <span className="mas"><Icon name="mas2" /></span>
              <span className="n">{l.nombre}{l.tipo === 'producto' && <small> · stock {l.stock}</small>}</span>
              <b>{soles(l.precio)}</b>
            </button>
          ))}
        </div>
      ) : (
        <div className="cw-extra-form">
          <input placeholder="Ej. Pulida extra" value={extra.nombre} onChange={(e) => setExtra({ ...extra, nombre: e.target.value })} />
          <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="S/" value={extra.precio} onChange={(e) => setExtra({ ...extra, precio: e.target.value })} />
          <button type="button" className="cw-btn mini" onClick={agregarExtra}>Agregar</button>
        </div>
      )}

      <h4 className="cw-sub">En este ticket</h4>
      {items.length === 0 && <p className="cw-vacio">Aún no agregaste nada.</p>}
      {items.map((it) => (
        <div key={it.key} className="cw-linea">
          <div className="top">
            <span className="n">{it.nombre}</span>
            <button type="button" className="cw-icbtn peligro chico" onClick={() => quitar(it.key)} aria-label="Quitar"><Icon name="borrar" /></button>
          </div>
          <div className="ctl">
            <div className="cant">
              <button type="button" onClick={() => (Number(it.cant) > 1 ? cambiar(it.key, { cant: Number(it.cant) - 1 }) : quitar(it.key))} aria-label="Menos">−</button>
              <b>{it.cant}</b>
              <button type="button" onClick={() => cambiar(it.key, { cant: Number(it.cant) + 1 })} aria-label="Más">+</button>
            </div>
            <label className="precio">
              <span>S/</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={it.precio} onChange={(e) => cambiar(it.key, { precio: e.target.value })} />
            </label>
            <b className="sub">{soles(Number(it.precio || 0) * Number(it.cant))}</b>
          </div>
        </div>
      ))}

      <div className="cw-totales">
        <div className="fila"><span>Subtotal</span><b>{soles(sub)}</b></div>
        <div className="fila">
          <span>Descuento</span>
          <label className="precio">
            <span>S/</span>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
          </label>
        </div>
        {aplicarGratis && <button type="button" className="cw-btn ghost mini" onClick={aplicarGratis}>🎁 Aplicar lavado gratis (fidelidad)</button>}
        <div className="fila total"><span>Total</span><b>{soles(total)}</b></div>
      </div>
    </div>
  )
}
