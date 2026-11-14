import Cabecera from './Cabecera.jsx'

const PLANTILLAS = [
  ['Al ingresar el auto', 'Hola {nombre}, recibimos tu vehículo {placa}. Sigue el avance aquí: {link}'],
  ['Vehículo listo', 'Hola {nombre}, tu vehículo {placa} ya está listo para recoger. ¡Gracias por elegirnos!'],
  ['Cliente inactivo (+15 días)', 'Hola {nombre}, en CARWASH CAMPOS te extrañamos. Vuelve esta semana y te damos una sorpresa.'],
]

export default function Config() {
  return (
    <>
      <Cabecera titulo="Configuración" subtitulo="Datos del negocio y mensajes" />
      <div className="cw-content cw-overlap">
        <div className="cw-dos">
          <div className="cw-card">
            <h3>Datos del negocio</h3>
            <div className="cw-logo-cfg"><img src="/logo-carwash.webp" alt="Logo" /><button className="cw-btn ghost mini">Cambiar logo</button></div>
            <div className="cw-campo"><label>Nombre</label><input defaultValue="CARWASH CAMPOS" /></div>
            <div className="cw-campo"><label>RUC</label><input placeholder="20000000000" /></div>
            <div className="cw-campo"><label>Dirección</label><input placeholder="Av. Principal 123" /></div>
            <div className="cw-campo"><label>Teléfono</label><input placeholder="999 999 999" /></div>
            <div className="cw-campo"><label>Mensaje al pie del ticket</label><input defaultValue="¡Limpieza que te hace brillar!" /></div>
            <button className="cw-btn">Guardar</button>
          </div>
          <div className="cw-card">
            <h3>Plantillas de WhatsApp</h3>
            {PLANTILLAS.map(([t, m]) => (
              <div key={t} className="cw-campo">
                <label>{t}</label>
                <textarea rows={3} defaultValue={m} />
              </div>
            ))}
            <p className="cw-nota">Puedes usar {'{nombre}'}, {'{placa}'} y {'{link}'}.</p>
            <button className="cw-btn">Guardar plantillas</button>
          </div>
        </div>
      </div>
    </>
  )
}
