export default function PageHeader({ titulo, subtitulo, ahora, compact = false, portada = false }) {
  const fecha = ahora && ahora.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = ahora && ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  if (portada) {
    return (
      <header className="page-header portada">
        <div className="logo-glow">
          <img className="portada-logo" src="/logo-campos.webp" alt="Campos Gas" />
        </div>
        <div className="portada-texto">
          <h2>{titulo}</h2>
          {subtitulo && <div className="sub">{subtitulo}</div>}
        </div>
        {ahora && (
          <div className="datetime">
            <div>{fecha}</div>
            <div>{hora}</div>
          </div>
        )}
      </header>
    )
  }

  return (
    <header className={`page-header${compact ? ' compact' : ''}`}>
      <div className="top-row">
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <div className="sub">{subtitulo}</div>}
        </div>
        {ahora && (
          <div className="datetime">
            <div>{fecha}</div>
            <div>{hora}</div>
          </div>
        )}
      </div>
    </header>
  )
}
