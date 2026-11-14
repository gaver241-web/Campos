import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { Modal, Campo, BotonesFila, confirmar } from './Ui.jsx'
import { useStore, acc, totalOrden } from './store.js'
import { soles, hoy, diasEntre, fechaCorta, normPlaca, rellenar, linkWhatsApp } from './data.js'

function FormCliente({ inicial, onClose }) {
  const [f, setF] = useState({ nombre: '', tel: '', doc: '', correo: '', marca: '', credito: false, ...inicial })
  const [placas, setPlacas] = useState((inicial?.placas || []).join(', '))
  const set = (k, v) => setF({ ...f, [k]: v })
  const guardar = () => {
    if (!f.nombre.trim()) return
    acc.guardar('clientes', {
      visitas: 0, gasto: 0, ...f, nombre: f.nombre.trim(),
      placas: placas.split(/[,\s]+/).map(normPlaca).filter(Boolean),
    })
    onClose()
  }
  return (
    <Modal titulo={inicial ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <Campo label="Nombre o empresa"><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus /></Campo>
      <div className="cw-fila-dos">
        <Campo label="Celular (WhatsApp)"><input type="tel" inputMode="tel" value={f.tel} onChange={(e) => set('tel', e.target.value)} /></Campo>
        <Campo label="DNI / RUC"><input inputMode="numeric" value={f.doc} onChange={(e) => set('doc', e.target.value)} /></Campo>
      </div>
      <Campo label="Correo (opcional)"><input type="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} /></Campo>
      <Campo label="Placas" ayuda="Separadas por coma. Un cliente puede tener varias."><input value={placas} onChange={(e) => setPlacas(e.target.value.toUpperCase())} placeholder="ABC-123, XYZ-987" /></Campo>
      <Campo label="Vehículo (marca / modelo)"><input value={f.marca} onChange={(e) => set('marca', e.target.value)} /></Campo>
      <label className="cw-check-simple"><input type="checkbox" checked={!!f.credito} onChange={(e) => set('credito', e.target.checked)} /> Cliente con convenio / crédito</label>
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

export default function Clientes() {
  const { clientes, ordenes, config } = useStore()
  const [tab, setTab] = useState('todos')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [form, setForm] = useState(null)

  const ultimaVisita = (c) => {
    const pl = c.placas.map(normPlaca)
    const f = ordenes.filter((o) => o.pagado && pl.includes(normPlaca(o.placa))).map((o) => o.fechaPago).sort().pop()
    return f || null
  }
  const dias = (c) => { const u = ultimaVisita(c); return u ? diasEntre(u, hoy()) : null }

  const lista = clientes
    .filter((c) => (c.nombre + c.placas.join(' ')).toLowerCase().includes(q.toLowerCase()))
    .filter((c) => tab === 'todos' || (dias(c) !== null && dias(c) >= 15))

  const sel = clientes.find((c) => c.id === abierto)
  const historial = sel ? ordenes.filter((o) => o.pagado && sel.placas.map(normPlaca).includes(normPlaca(o.placa))).sort((a, b) => (b.pagoTs || 0) - (a.pagoTs || 0)) : []
  const wa = (c, plantilla) => linkWhatsApp(c.tel, rellenar(config.plantillas[plantilla], { nombre: c.nombre.split(' ')[0], placa: c.placas[0] || '', link: '' }))

  const borrar = (c) => {
    if (!confirmar(`¿Borrar a ${c.nombre}? Sus tickets se conservan.`)) return
    acc.borrar('clientes', c.id)
    if (abierto === c.id) setAbierto(null)
  }

  return (
    <>
      <Cabecera titulo="Clientes" subtitulo="Historial y fidelización" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          <button className={tab === 'todos' ? 'active' : ''} onClick={() => setTab('todos')}>Todos</button>
          <button className={tab === 'inactivos' ? 'active' : ''} onClick={() => setTab('inactivos')}>Sin volver +15 días</button>
        </div>

        <div className="cw-split">
          <div className="cw-card">
            <input className="cw-buscar" placeholder="Buscar por nombre o placa" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="cw-btn ghost" style={{ marginTop: 0, marginBottom: 6 }} onClick={() => setForm({})}>+ Nuevo cliente</button>
            {lista.length === 0 && <p className="cw-vacio">{clientes.length === 0 ? 'Aún no hay clientes. Se crean solos al hacer un ticket con nombre.' : 'Sin resultados'}</p>}
            {lista.map((c) => (
              <div key={c.id} className={`cw-fila${abierto === c.id ? ' sel' : ''}`} onClick={() => setAbierto(c.id)}>
                <div className="info">
                  <strong>{c.nombre}</strong>
                  <div className="placas">{c.placas.map((p) => <span key={p} className="cw-placa chico">{p}</span>)}</div>
                  <div className="cw-meta">{dias(c) === null ? 'Sin visitas cobradas' : dias(c) >= 15 ? <span className="rojo">Hace {dias(c)} días</span> : `Hace ${dias(c)} días`} · {c.visitas || 0} visitas</div>
                </div>
                {tab === 'inactivos' && c.tel ? (
                  <a className="cw-btn mini wa" href={wa(c, 'inactivo')} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="whatsapp" /> Invitar</a>
                ) : <Icon name="flecha" />}
              </div>
            ))}
          </div>

          {sel && (
            <div className="cw-card cw-detalle">
              <div className="cw-fila plano" style={{ paddingTop: 0 }}>
                <div className="info"><h3 style={{ marginBottom: 2 }}>{sel.nombre}</h3><div className="cw-meta">{[sel.marca, sel.tel, sel.doc].filter(Boolean).join(' · ')}</div></div>
                <BotonesFila onEditar={() => setForm(sel)} onBorrar={() => borrar(sel)} />
              </div>
              {sel.credito && <span className="cw-chip">Cliente con crédito</span>}
              <div className="cw-kpis dos">
                <div className="cw-kpi"><span className="et">Gasto total</span><span className="val">{soles(sel.gasto)}</span></div>
                <div className="cw-kpi"><span className="et">Visitas</span><span className="val">{sel.visitas || 0}</span></div>
              </div>
              <div className="cw-fide-box">
                <div className="fila"><span>Programa de fidelidad</span><b>{(sel.visitas || 0) % 6} / 5</b></div>
                <div className="puntos">
                  {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= (sel.visitas || 0) % 6 ? 'on' : ''} />)}
                  <i className="regalo">🎁</i>
                </div>
              </div>
              <h4 className="cw-sub">Historial</h4>
              {historial.length === 0 && <p className="cw-vacio">Sin servicios cobrados todavía.</p>}
              {historial.slice(0, 15).map((o) => (
                <div key={o.id} className="cw-fila plano">
                  <div className="info"><strong>{o.items.map((i) => i.nombre).join(', ')}</strong><div className="cw-meta">{fechaCorta(o.fechaPago)} · {o.placa}</div></div>
                  <b>{soles(totalOrden(o))}</b>
                </div>
              ))}
              {sel.tel && <a className="cw-btn wa" href={wa(sel, 'inactivo')} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" /> Escribir por WhatsApp</a>}
            </div>
          )}
        </div>
      </div>
      {form && <FormCliente inicial={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  )
}
