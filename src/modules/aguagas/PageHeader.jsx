export default function PageHeader({ titulo, subtitulo, ahora, compact = false }) {
  return (
    <header className={`page-header${compact ? ' compact' : ''}`}>
      <div className="top-row">
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <div className="sub">{subtitulo}</div>}
        </div>
        {ahora && (
          <div className="datetime">
            <div>{ahora.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div>{ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )}
      </div>
    </header>
  )
}
