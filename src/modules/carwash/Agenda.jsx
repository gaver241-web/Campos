import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { CITAS, MAQUINAS, catEmoji } from './data.js'

const HORAS = Array.from({ length: 10 }, (_, i) => 8 + i)
const aNum = (h) => { const [a, b] = h.split(':'); return Number(a) + Number(b) / 60 }

export default function Agenda() {
  const [tab, setTab] = useState('citas')
  return (
    <>
      <Cabecera titulo="Agenda" subtitulo="Citas y mantenimiento" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          <button className={tab === 'citas' ? 'active' : ''} onClick={() => setTab('citas')}>Citas de hoy</button>
          <button className={tab === 'maq' ? 'active' : ''} onClick={() => setTab('maq')}>Maquinaria</button>
        </div>

        {tab === 'citas' && (
          <div className="cw-split">
            <div className="cw-card">
              <h3>Calendario del día</h3>
              <div className="cw-agenda">
                {HORAS.map((h) => <div key={h} className="hora"><span>{h}:00</span></div>)}
                {CITAS.map((c) => (
                  <div key={c.id} className="bloque" style={{ top: `${(aNum(c.hora) - 8) * 56}px`, height: `${c.dur * 56 - 4}px` }}>
                    <b>{c.servicio}</b><span>{c.placa}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cw-card">
              <h3>Próximas citas</h3>
              {CITAS.map((c) => (
                <div key={c.id} className="cw-fila plano">
                  <div className="info">
                    <strong>{c.hora} · {c.servicio}</strong>
                    <div className="cw-meta">{catEmoji(c.cat)} {c.placa} · {c.cliente}</div>
                  </div>
                  <button className="cw-btn mini">Convertir en orden</button>
                </div>
              ))}
              <button className="cw-btn ghost">+ Nueva cita</button>
            </div>
          </div>
        )}

        {tab === 'maq' && (
          <div className="cw-maquinas">
            {MAQUINAS.map((m) => {
              const p = Math.round((m.uso / m.limite) * 100)
              const nivel = p >= 95 ? 'rojo' : p >= 85 ? 'ambar' : ''
              return (
                <div key={m.id} className="cw-card cw-maq">
                  <h3>{m.nombre}</h3>
                  <div className="cw-meta">{m.tarea} a los {m.limite} lavados</div>
                  <div className="cw-stockbar grande"><i className={nivel} style={{ width: `${Math.min(p, 100)}%` }} /></div>
                  <div className="cw-leyenda"><span>{m.uso} usos</span><span>{m.limite - m.uso} para el aviso</span></div>
                  {nivel && <span className={`cw-chip ${nivel}`}>Mantenimiento próximo</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
