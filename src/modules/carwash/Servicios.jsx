import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { CATEGORIAS, SERVICIOS, COMBOS, PRODUCTOS, soles } from './data.js'

export default function Servicios() {
  const [tab, setTab] = useState('servicios')
  return (
    <>
      <Cabecera titulo="Servicios y tarifas" subtitulo="Precios por tipo de vehículo" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          {[['servicios', 'Tarifario'], ['combos', 'Combos'], ['inventario', 'Inventario']].map(([id, t]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t}</button>
          ))}
        </div>

        {tab === 'servicios' && (
          <div className="cw-card">
            <div className="cw-tabla-wrap">
              <table className="cw-tabla">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    {CATEGORIAS.map((c) => <th key={c.id}>{c.emoji}<br />{c.corto}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SERVICIOS.map((s) => (
                    <tr key={s.id}>
                      <td>{s.nombre}</td>
                      {CATEGORIAS.map((c) => <td key={c.id}>{s.precios[c.id] ? s.precios[c.id] : '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="cw-btn">+ Nuevo servicio</button>
          </div>
        )}

        {tab === 'combos' && (
          <div className="cw-combos">
            {COMBOS.map((c) => (
              <div key={c.id} className="cw-combo">
                <span className="ahorro">Ahorras {soles(c.ahorro)}</span>
                <h3>{c.nombre}</h3>
                <p>{c.incluye.join(' + ')}</p>
                <div className="precio">{soles(c.precio)}</div>
              </div>
            ))}
            <button className="cw-btn">+ Nuevo combo</button>
          </div>
        )}

        {tab === 'inventario' && (
          <div className="cw-card">
            {PRODUCTOS.map((p) => {
              const bajo = p.stock < p.minimo
              return (
                <div key={p.id} className="cw-fila plano">
                  <div className="info">
                    <strong>{p.nombre}</strong>
                    <div className="cw-meta">{p.tipo}{p.precio ? ` · ${soles(p.precio)}` : ''} · mínimo {p.minimo}</div>
                    <div className="cw-stockbar"><i className={bajo ? 'bajo' : ''} style={{ width: `${Math.min(100, (p.stock / (p.minimo * 2)) * 100)}%` }} /></div>
                  </div>
                  <div className="lado">
                    <b className={bajo ? 'rojo' : ''}>{p.stock}</b>
                    {bajo && <span className="cw-chip rojo">Stock bajo</span>}
                  </div>
                </div>
              )
            })}
            <button className="cw-btn">+ Nuevo producto</button>
          </div>
        )}
      </div>
    </>
  )
}
