import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

// Cada sistema (agua-gas / carwash) tiene su propio inicio de sesión
const SISTEMAS = {
  aguagas: { titulo: 'Venta de Agua y Gas', logo: '/logo-campos.webp' },
  carwash: { titulo: 'Carwash Campos', logo: '/logo-carwash.webp' },
}
const clave = (app) => `campos:sesion:${app}` // recuerda quién entró en este equipo (para abrir sin internet)

const AuthCtx = createContext({ rol: 'admin', nombre: '' })
export const useAuth = () => useContext(AuthCtx)

export async function cerrarSesion(app) {
  try {
    await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app }) })
  } catch (e) { /* sin conexión */ }
  localStorage.removeItem(clave(app))
  window.location.hash = '#/'
  window.location.reload()
}

function Login({ app, onOk }) {
  const sis = SISTEMAS[app]
  const [usuario, setUsuario] = useState('')
  const [pass, setPass] = useState('')
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
        body: JSON.stringify({ app, usuario, password: pass }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        const sesion = { rol: d.rol, nombre: d.nombre }
        localStorage.setItem(clave(app), JSON.stringify(sesion))
        onOk(sesion)
        return
      }
      setError(d.error || 'No se pudo iniciar sesión')
    } catch (err) {
      setError('No hay conexión con el servidor. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div className="login-pagina">
      <form className="login-caja" onSubmit={entrar}>
        <img className="login-logo" src={sis.logo} alt={sis.titulo} />
        <h1>{sis.titulo}</h1>
        <p className="login-sub">Inicia sesión para continuar</p>
        <label>
          Usuario o correo
          <input type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" value={usuario} onChange={(e) => setUsuario(e.target.value)} required autoFocus />
        </label>
        <label>
          Contraseña
          <div className="login-clave">
            <input type={ver ? 'text' : 'password'} autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
            <button type="button" className="login-ver" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Ver'}</button>
          </div>
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-entrar" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <a className="login-volver" href="#/">← Volver al inicio</a>
      </form>
    </div>
  )
}

// Envuelve las pantallas de UN sistema: sin sesión de ese sistema solo se ve su login
export default function RequireAuth({ app }) {
  const [estado, setEstado] = useState('cargando') // cargando | si | no
  const [sesion, setSesion] = useState({ rol: 'admin', nombre: '' })

  useEffect(() => {
    let vivo = true
    setEstado('cargando')
    fetch(`/api/me?app=${app}`)
      .then(async (r) => {
        if (!vivo) return
        if (r.ok) {
          const d = await r.json()
          const s = { rol: d.rol, nombre: d.nombre }
          localStorage.setItem(clave(app), JSON.stringify(s))
          setSesion(s)
          setEstado('si')
        } else {
          localStorage.removeItem(clave(app))
          setEstado('no')
        }
      })
      .catch(() => {
        if (!vivo) return
        // Sin internet: pasa solo si este equipo ya había iniciado sesión en este sistema
        try {
          const s = JSON.parse(localStorage.getItem(clave(app)))
          if (s && s.rol) { setSesion(s); setEstado('si'); return }
        } catch (e) { /* nada guardado */ }
        setEstado('no')
      })
    const vencida = () => { localStorage.removeItem(clave(app)); setEstado('no') }
    window.addEventListener('auth-expirada', vencida)
    return () => { vivo = false; window.removeEventListener('auth-expirada', vencida) }
  }, [app])

  if (estado === 'cargando') return <div className="login-pagina"><p className="login-cargando">Cargando…</p></div>
  if (estado === 'no') return <Login app={app} onOk={(s) => { setSesion(s); setEstado('si') }} />
  return <AuthCtx.Provider value={sesion}><Outlet /></AuthCtx.Provider>
}
