import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { soles, normPlaca } from './data.js'

const totalOrden = (o) => Math.max(0, (o.items || []).reduce((a, i) => a + Number(i.precio || 0) * Number(i.cant || 0), 0) - Number(o.descuento || 0))
const PASOS = ['En cola', 'Lavando', '¡Listo para recoger!']
const PASO_DE = { espera: 0, lavado: 1, listo: 2, terminado: 2 }
const TITULO = ['Tu vehículo está en cola', 'Tu vehículo se está lavando', '¡Tu vehículo está listo!']

export default function Seguimiento() {
  const { placa } = useParams()
  const [datos, setDatos] = useState(null) // { orden, config } desde la base de datos
  const [fallo, setFallo] = useState(false)

  // Esta página la abre el cliente desde su celular: consulta la base de datos y se actualiza sola
  useEffect(() => {
    let vivo = true
    const traer = () =>
      fetch(`/api/carwash/seguimiento/${encodeURIComponent(normPlaca(placa))}`)
        .then((r) => { if (!r.ok) throw new Error(); return r.json() })
        .then((d) => { if (vivo) { setDatos(d); setFallo(false) } })
        .catch(() => { if (vivo) setFallo(true) })
    traer()
    const t = setInterval(traer, 15000)
    return () => { vivo = false; clearInterval(t) }
  }, [placa])

  const config = datos?.config || { nombre: 'CARWASH CAMPOS', direccion: '', telefono: '' }
  const o = datos?.orden
  const actual = o ? PASO_DE[o.estado] : 0

  return (
    <div className="cw-publico">
      <img className="logo" src="/logo-carwash.webp" alt={config.nombre} />
      <div className="cw-card">
        <span className="cw-placa grande">{normPlaca(placa)}</span>
        {!datos ? (
          <p className="cw-nota">{fallo ? 'No pudimos consultar el estado. Intenta de nuevo en unos segundos.' : 'Buscando tu vehículo…'}</p>
        ) : !o ? (
          <p className="cw-nota">No encontramos un servicio activo para esta placa.</p>
        ) : (
          <>
            <h3>{TITULO[actual]}</h3>
            <ol className="cw-pasos">
              {PASOS.map((p, i) => (
                <li key={p} className={i < actual || (i === actual && actual === 2) ? 'hecho' : i === actual ? 'ahora' : ''}>
                  <span className="n">{i < actual || (i === actual && actual === 2) ? '✓' : i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
            <h4 className="cw-sub">Servicios</h4>
            {o.items.map((i) => <div key={i.key} className="cw-fila plano"><span>{i.cant} × {i.nombre}</span><b>{soles(i.precio * i.cant)}</b></div>)}
            <div className="cw-fila plano"><b>Total</b><b>{soles(totalOrden(o))}</b></div>
          </>
        )}
        <p className="cw-nota">{[config.direccion, config.telefono && `Tel. ${config.telefono}`].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  )
}
