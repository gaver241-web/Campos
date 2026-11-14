import { useEffect } from 'react'
import Icon from './Icons.jsx'
import { CATEGORIAS } from './data.js'

export function Modal({ titulo, onClose, children, ancho = '' }) {
  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', tecla)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="cw-modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`cw-modal ${ancho}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="cw-modal-cab">
          <h3>{titulo}</h3>
          <button type="button" className="cw-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="cw-modal-cuerpo">{children}</div>
      </div>
    </div>
  )
}

export function Campo({ label, children, ayuda }) {
  return (
    <label className="cw-campo">
      <span className="cw-lbl">{label}</span>
      {children}
      {ayuda && <span className="cw-ayuda">{ayuda}</span>}
    </label>
  )
}

export function BotonesFila({ onEditar, onBorrar }) {
  return (
    <div className="cw-iconos">
      {onEditar && (
        <button type="button" className="cw-icbtn" onClick={onEditar} aria-label="Editar"><Icon name="editar" /></button>
      )}
      {onBorrar && (
        <button type="button" className="cw-icbtn peligro" onClick={onBorrar} aria-label="Borrar"><Icon name="borrar" /></button>
      )}
    </div>
  )
}

export const confirmar = (texto) => window.confirm(texto)

// Precios por tipo de vehículo (0 o vacío = no aplica)
export function PreciosCategoria({ precios, setPrecios }) {
  const poner = (id, v) => setPrecios({ ...precios, [id]: v })
  const todos = (v) => setPrecios(Object.fromEntries(CATEGORIAS.map((c) => [c.id, v])))
  return (
    <div className="cw-precios-cat">
      <div className="cw-precios-todos">
        <span>Mismo precio para todos</span>
        <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="S/" onChange={(e) => todos(e.target.value)} />
      </div>
      {CATEGORIAS.map((c) => (
        <label key={c.id} className="cw-precio-fila">
          <span>{c.emoji} {c.nombre}</span>
          <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={precios[c.id] ?? ''} onChange={(e) => poner(c.id, e.target.value)} />
        </label>
      ))}
      <p className="cw-nota">Deja en 0 el tipo de vehículo al que no aplica este servicio.</p>
    </div>
  )
}

export const limpiarPrecios = (p) => Object.fromEntries(CATEGORIAS.map((c) => [c.id, Math.max(0, Number(p[c.id]) || 0)]))
