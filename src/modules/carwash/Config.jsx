import { useRef, useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { Campo, confirmar } from './Ui.jsx'
import { useStore, acc } from './store.js'

export default function Config() {
  const { config, ordenes, clientes, servicios } = useStore()
  const [f, setF] = useState({ nombre: config.nombre, ruc: config.ruc, direccion: config.direccion, telefono: config.telefono, pie: config.pie })
  const [pl, setPl] = useState(config.plantillas)
  const [ok, setOk] = useState('')
  const archivo = useRef(null)
  const set = (k, v) => setF({ ...f, [k]: v })
  const aviso = (t) => { setOk(t); setTimeout(() => setOk(''), 2500) }

  const respaldo = () => {
    const url = URL.createObjectURL(new Blob([acc.exportar()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `respaldo-carwash-${new Date().toLocaleDateString('en-CA')}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const restaurar = (file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      try {
        if (!confirmar('Esto reemplaza todos los datos actuales por los del respaldo. ¿Continuar?')) return
        acc.importar(String(r.result))
        aviso('Respaldo restaurado')
      } catch (e) { alert('El archivo no es un respaldo válido.') }
    }
    r.readAsText(file)
  }
  const vaciar = () => {
    if (!confirmar('¿Borrar TODOS los datos de Carwash (servicios, combos, inventario, clientes, tickets, gastos)? No se puede deshacer.')) return
    if (!confirmar('Última confirmación: se empieza el negocio desde cero.')) return
    acc.vaciarTodo()
    aviso('Todo borrado. Puedes empezar de cero.')
  }

  return (
    <>
      <Cabecera titulo="Configuración" subtitulo="Negocio, mensajes y datos" />
      <div className="cw-content cw-overlap">
        {ok && <div className="cw-toast">{ok}</div>}
        <div className="cw-dos">
          <div className="cw-card">
            <h3>Datos del negocio</h3>
            <Campo label="Nombre"><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} /></Campo>
            <Campo label="RUC"><input inputMode="numeric" value={f.ruc} onChange={(e) => set('ruc', e.target.value)} /></Campo>
            <Campo label="Dirección"><input value={f.direccion} onChange={(e) => set('direccion', e.target.value)} /></Campo>
            <Campo label="Teléfono"><input type="tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} /></Campo>
            <Campo label="Mensaje al pie del ticket"><input value={f.pie} onChange={(e) => set('pie', e.target.value)} /></Campo>
            <button className="cw-btn" onClick={() => { acc.guardarConfig(f); aviso('Datos guardados') }}>Guardar</button>
          </div>

          <div className="cw-card">
            <h3>Plantillas de WhatsApp</h3>
            {[['ingreso', 'Al ingresar el vehículo'], ['listo', 'Vehículo listo para recoger'], ['inactivo', 'Cliente que no vuelve (+15 días)']].map(([k, t]) => (
              <Campo key={k} label={t}><textarea rows={3} value={pl[k]} onChange={(e) => setPl({ ...pl, [k]: e.target.value })} /></Campo>
            ))}
            <p className="cw-nota">Puedes usar {'{nombre}'}, {'{placa}'} y {'{link}'}.</p>
            <button className="cw-btn" onClick={() => { acc.guardarConfig({ plantillas: pl }); aviso('Plantillas guardadas') }}>Guardar plantillas</button>
          </div>
        </div>

        <div className="cw-card">
          <h3>Mis datos</h3>
          <p className="cw-nota">
            Tienes {servicios.length} servicios, {clientes.length} clientes y {ordenes.length} tickets guardados en la base de datos ({acc.tamanoKB()} KB).
            Se sincronizan solos entre tus equipos. Aun así, descarga un respaldo de vez en cuando.
          </p>
          <div className="cw-btn-fila cw-btn-envolver">
            <button className="cw-btn ghost" onClick={respaldo}>Descargar respaldo</button>
            <button className="cw-btn ghost" onClick={() => archivo.current.click()}>Restaurar respaldo</button>
            <input ref={archivo} type="file" accept="application/json,.json" hidden onChange={(e) => { restaurar(e.target.files[0]); e.target.value = '' }} />
          </div>
          <div className="cw-btn-fila cw-btn-envolver">
            <button className="cw-btn ghost" onClick={() => confirmar('Se agregan servicios, combo, productos y máquina de ejemplo (reemplazan los actuales). ¿Cargar?') && acc.cargarEjemplos()}>Cargar ejemplos</button>
            <button className="cw-btn ghost peligro" onClick={vaciar}>Empezar desde cero</button>
          </div>
        </div>
      </div>
    </>
  )
}
