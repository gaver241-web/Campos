import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cabecera from './Cabecera.jsx'
import { Modal, Campo, BotonesFila, confirmar } from './Ui.jsx'
import { useStore, acc } from './store.js'
import { CATEGORIAS, hoy, catEmoji } from './data.js'

const HORAS = Array.from({ length: 12 }, (_, i) => 7 + i)
const aNum = (h) => { const [a, b] = (h || '08:00').split(':'); return Number(a) + Number(b) / 60 }

function FormCita({ inicial, fecha, onClose }) {
  const [f, setF] = useState({ fecha, hora: '09:00', dur: '1', placa: '', cliente: '', tel: '', servicio: '', cat: 'auto', ...inicial })
  const set = (k, v) => setF({ ...f, [k]: v })
  const guardar = () => {
    if (!f.servicio.trim()) return
    acc.guardar('citas', { ...f, placa: f.placa.toUpperCase(), dur: Number(f.dur) || 1 })
    onClose()
  }
  return (
    <Modal titulo={inicial ? 'Editar cita' : 'Nueva cita'} onClose={onClose}>
      <Campo label="Servicio"><input value={f.servicio} onChange={(e) => set('servicio', e.target.value)} placeholder="Ej. Pulido completo" autoFocus /></Campo>
      <div className="cw-fila-dos">
        <Campo label="Fecha"><input type="date" value={f.fecha} onChange={(e) => set('fecha', e.target.value)} /></Campo>
        <Campo label="Hora"><input type="time" value={f.hora} onChange={(e) => set('hora', e.target.value)} /></Campo>
      </div>
      <Campo label="Duración (horas)"><input type="number" inputMode="decimal" min="0.5" step="0.5" value={f.dur} onChange={(e) => set('dur', e.target.value)} /></Campo>
      <div className="cw-fila-dos">
        <Campo label="Placa"><input value={f.placa} onChange={(e) => set('placa', e.target.value.toUpperCase())} /></Campo>
        <Campo label="Tipo"><select value={f.cat} onChange={(e) => set('cat', e.target.value)}>{CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Campo>
      </div>
      <div className="cw-fila-dos">
        <Campo label="Cliente"><input value={f.cliente} onChange={(e) => set('cliente', e.target.value)} /></Campo>
        <Campo label="Celular"><input type="tel" value={f.tel} onChange={(e) => set('tel', e.target.value)} /></Campo>
      </div>
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

function FormMaquina({ inicial, onClose }) {
  const [f, setF] = useState({ nombre: '', tarea: '', limite: '300', uso: '0', ...inicial })
  const set = (k, v) => setF({ ...f, [k]: v })
  const guardar = () => {
    if (!f.nombre.trim()) return
    acc.guardar('maquinas', { ...f, limite: Number(f.limite) || 0, uso: Number(f.uso) || 0 })
    onClose()
  }
  return (
    <Modal titulo={inicial ? 'Editar máquina' : 'Nueva máquina'} onClose={onClose}>
      <Campo label="Equipo"><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Hidrolavadora" autoFocus /></Campo>
      <Campo label="Qué mantenimiento toca"><input value={f.tarea} onChange={(e) => set('tarea', e.target.value)} placeholder="Ej. Cambio de aceite" /></Campo>
      <div className="cw-fila-dos">
        <Campo label="Avisar cada (lavados)"><input type="number" inputMode="numeric" min="1" value={f.limite} onChange={(e) => set('limite', e.target.value)} /></Campo>
        <Campo label="Usos actuales"><input type="number" inputMode="numeric" min="0" value={f.uso} onChange={(e) => set('uso', e.target.value)} /></Campo>
      </div>
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

export default function Agenda() {
  const navigate = useNavigate()
  const { citas, maquinas } = useStore()
  const [tab, setTab] = useState('citas')
  const [fecha, setFecha] = useState(hoy())
  const [form, setForm] = useState(null)

  const delDia = citas.filter((c) => c.fecha === fecha).sort((a, b) => aNum(a.hora) - aNum(b.hora))

  const convertir = (c) => {
    navigate('/carwash/orden', { state: { cita: c } })
    acc.borrar('citas', c.id)
  }

  return (
    <>
      <Cabecera titulo="Agenda" subtitulo="Citas y mantenimiento" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          <button className={tab === 'citas' ? 'active' : ''} onClick={() => setTab('citas')}>Citas</button>
          <button className={tab === 'maq' ? 'active' : ''} onClick={() => setTab('maq')}>Maquinaria</button>
        </div>

        {tab === 'citas' && (
          <div className="cw-split">
            <div className="cw-card">
              <Campo label="Día"><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} /></Campo>
              <div className="cw-agenda">
                {HORAS.map((h) => <div key={h} className="hora"><span>{h}:00</span></div>)}
                {delDia.map((c) => (
                  <div key={c.id} className="bloque" style={{ top: `${Math.max(0, aNum(c.hora) - 7) * 56}px`, height: `${Math.max(0.5, c.dur) * 56 - 4}px` }}>
                    <b>{c.servicio}</b><span>{c.placa}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cw-card">
              <button className="cw-btn" style={{ marginTop: 0 }} onClick={() => setForm({ tipo: 'cita' })}>+ Nueva cita</button>
              <h4 className="cw-sub">Citas del día</h4>
              {delDia.length === 0 && <p className="cw-vacio">No hay citas para este día.</p>}
              {delDia.map((c) => (
                <div key={c.id} className="cw-fila plano">
                  <div className="info">
                    <strong>{c.hora} · {c.servicio}</strong>
                    <div className="cw-meta">{catEmoji(c.cat)} {c.placa || 'Sin placa'}{c.cliente ? ` · ${c.cliente}` : ''}</div>
                    <button className="cw-btn mini" style={{ marginTop: 8 }} onClick={() => convertir(c)}>Convertir en ticket</button>
                  </div>
                  <BotonesFila onEditar={() => setForm({ tipo: 'cita', item: c })} onBorrar={() => confirmar('¿Borrar esta cita?') && acc.borrar('citas', c.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'maq' && (
          <>
            <button className="cw-btn" style={{ marginTop: 0, marginBottom: 14 }} onClick={() => setForm({ tipo: 'maq' })}>+ Nueva máquina</button>
            {maquinas.length === 0 && <div className="cw-card centro"><p>No hay máquinas registradas.</p><p className="cw-nota">Cada ticket cobrado suma un uso a tus máquinas y te avisa cuando toca mantenimiento.</p></div>}
            <div className="cw-maquinas">
              {maquinas.map((m) => {
                const p = m.limite > 0 ? Math.round((m.uso / m.limite) * 100) : 0
                const nivel = p >= 95 ? 'rojo' : p >= 85 ? 'ambar' : ''
                return (
                  <div key={m.id} className="cw-card cw-maq">
                    <div className="cw-fila plano" style={{ padding: 0, border: 'none' }}>
                      <div className="info"><h3 style={{ marginBottom: 2 }}>{m.nombre}</h3><div className="cw-meta">{m.tarea || 'Mantenimiento'} a los {m.limite} lavados</div></div>
                      <BotonesFila onEditar={() => setForm({ tipo: 'maq', item: m })} onBorrar={() => confirmar(`¿Borrar ${m.nombre}?`) && acc.borrar('maquinas', m.id)} />
                    </div>
                    <div className="cw-stockbar grande"><i className={nivel} style={{ width: `${Math.min(p, 100)}%` }} /></div>
                    <div className="cw-leyenda"><span>{m.uso} usos</span><span>{Math.max(0, m.limite - m.uso)} para el aviso</span></div>
                    {nivel && <span className={`cw-chip ${nivel}`}>Mantenimiento próximo</span>}
                    <button className="cw-btn ghost mini" style={{ marginTop: 10 }} onClick={() => acc.guardar('maquinas', { ...m, uso: 0 })}>Mantenimiento hecho (reiniciar)</button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      {form?.tipo === 'cita' && <FormCita inicial={form.item} fecha={fecha} onClose={() => setForm(null)} />}
      {form?.tipo === 'maq' && <FormMaquina inicial={form.item} onClose={() => setForm(null)} />}
    </>
  )
}
