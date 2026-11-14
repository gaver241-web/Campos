import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

const FLAG = 'campos:sesion-ok' // recuerda que este equipo ya inició sesión (para poder abrir sin internet)

export async function cerrarSesion() {
  try { await fetch('/api/logout', { method: 'POST' }) } catch (e) { /* sin conexión */ }
  localStorage.removeItem(FLAG)
  window.location.hash = '#/'
  window.location.reload()
}

function Login({ onOk }) {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: clave }),
      })
      if (res.ok) { localStorage.setItem(FLAG, '1'); onOk(); return }
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'No se pudo iniciar sesión')
    } catch (err) {
      setError('No hay conexión con el servidor. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div className="login-pagina">
      <form className="login-caja" onSubmit={entrar}>
        <img className="login-logo" src="/logo-gaver.webp" alt="Gaver Studio" />
        <h1>Iniciar sesión</h1>
        <label>
          Correo
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Contraseña
          <div className="login-clave">
            <input type={ver ? 'text' : 'password'} autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
            <button type="button" className="login-ver" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Ver'}</button>
          </div>
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-entrar" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}

// Envuelve todas las pantallas del sistema: sin sesión solo se ve el login
export default function RequireAuth() {
  const [estado, setEstado] = useState('cargando') // cargando | si | no

  useEffect(() => {
    let vivo = true
    fetch('/api/me')
      .then((r) => {
        if (!vivo) return
        if (r.ok) { localStorage.setItem(FLAG, '1'); setEstado('si') }
        else { localStorage.removeItem(FLAG); setEstado('no') }
      })
      .catch(() => { if (vivo) setEstado(localStorage.getItem(FLAG) ? 'si' : 'no') }) // sin internet: pasa si ya había entrado
    const vencida = () => { localStorage.removeItem(FLAG); setEstado('no') }
    window.addEventListener('auth-expirada', vencida)
    return () => { vivo = false; window.removeEventListener('auth-expirada', vencida) }
  }, [])

  if (estado === 'cargando') return <div className="login-pagina"><p className="login-cargando">Cargando…</p></div>
  if (estado === 'no') return <Login onOk={() => setEstado('si')} />
  return <Outlet />
}
