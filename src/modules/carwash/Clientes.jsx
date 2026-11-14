import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { CLIENTES, HISTORIAL, soles } from './data.js'

const wa = (c) =>
  `https://wa.me/51${c.tel}?text=${encodeURIComponent(`Hola ${c.nombre.split(' ')[0]}, en CARWASH CAMPOS te extrañamos. Vuelve esta semana y llévate un descuento en tu próximo lavado.`)}`

export default function Clientes() {
  const [tab, setTab] = useState('todos')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(CLIENTES[0].id)

  const lista = CLIENTES.filter((c) => {
    const txt = (c.nombre + c.placas.join(' ')).toLowerCase()
    return txt.includes(q.toLowerCase()) && (tab === 'todos' || c.ultima >= 15)
  })
  const sel = CLIENTES.find((c) => c.id === abierto)

  return (
    <>
      <Cabecera titulo="Clientes" subtitulo="Historial y fidelización" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          <button className={tab === 'todos' ? 'active' : ''} onClick={() => setTab('todos')}>Todos</button>
          <button className={tab === 'inactivos' ? 'active' : ''} onClick={() => setTab('inactivos')}>
            Sin volver +15 días <b>{CLIENTES.filter((c) => c.ultima >= 15).length}</b>
          </button>
        </div>

        <div className="cw-split">
          <div className="cw-card">
            <input className="cw-buscar" placeholder="Buscar por nombre o placa" value={q} onChange={(e) => setQ(e.target.value)} />
            {lista.length === 0 && <p className="cw-vacio">Sin resultados</p>}
            {lista.map((c) => (
              <div key={c.id} className={`cw-fila${abierto === c.id ? ' sel' : ''}`} onClick={() => setAbierto(c.id)}>
                <div className="info">
                  <strong>{c.nombre}</strong>
                  <div className="placas">{c.placas.map((p) => <span key={p} className="cw-placa chico">{p}</span>)}</div>
                  <div className="cw-meta">
                    {c.ultima >= 15 ? <span className="rojo">Hace {c.ultima} días</span> : `Hace ${c.ultima} días`} · {c.visitas} visitas
                  </div>
                </div>
                {tab === 'inactivos' ? (
                  <a className="cw-btn mini wa" href={wa(c)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Icon name="whatsapp" /> Invitar
                  </a>
                ) : (
                  <Icon name="flecha" />
                )}
              </div>
            ))}
          </div>

          {sel && (
            <div className="cw-card cw-detalle">
              <h3>{sel.nombre}</h3>
              <div className="cw-meta">{sel.marca} · {sel.tel}</div>
              {sel.credito && <span className="cw-chip">Cliente con crédito</span>}
              <div className="cw-kpis dos">
                <div className="cw-kpi"><span className="et">Gasto total</span><span className="val">{soles(sel.gasto)}</span></div>
                <div className="cw-kpi"><span className="et">Visitas</span><span className="val">{sel.visitas}</span></div>
              </div>
              <div className="cw-fide-box">
                <div className="fila"><span>Programa de fidelidad</span><b>{sel.visitas % 6} / 5</b></div>
                <div className="puntos">
                  {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= sel.visitas % 6 ? 'on' : ''} />)}
                  <i className="regalo">🎁</i>
                </div>
              </div>
              <h4 className="cw-sub">Historial</h4>
              {HISTORIAL.map((h, i) => (
                <div key={i} className="cw-fila plano">
                  <div className="info"><strong>{h.servicio}</strong><div className="cw-meta">{h.fecha}</div></div>
                  <b>{soles(h.monto)}</b>
                </div>
              ))}
              <a className="cw-btn wa" href={wa(sel)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" /> Escribir por WhatsApp</a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
