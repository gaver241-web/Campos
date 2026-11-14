export default function Cabecera({ titulo, subtitulo, logo = false }) {
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })
  return (
    <header className="cw-header">
      <div className="cw-header-in">
        {logo && <img className="cw-header-logo" src="/logo-carwash.webp" alt="" />}
        <div className="cw-header-txt">
          <h2>{titulo}</h2>
          {subtitulo && <div className="sub">{subtitulo}</div>}
        </div>
        <div className="cw-fecha">{fecha}</div>
      </div>
    </header>
  )
}
