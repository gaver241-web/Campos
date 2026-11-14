import { useParams } from 'react-router-dom'
import { useStore, totalOrden } from './store.js'
import { soles, normPlaca } from './data.js'

const PASOS = ['En cola', 'Lavando', '¡Listo para recoger!']
const PASO_DE = { espera: 0, lavado: 1, listo: 2, terminado: 2 }
const TITULO = ['Tu vehículo está en cola', 'Tu vehículo se está lavando', '¡Tu vehículo está listo!']

export default function Seguimiento() {
  const { placa } = useParams()
  const { ordenes, config } = useStore()
  const o = ordenes.filter((x) => normPlaca(x.placa) === normPlaca(placa)).sort((a, b) => b.ts - a.ts)[0]
  const actual = o ? PASO_DE[o.estado] : 0

  return (
    <div className="cw-publico">
      <img className="logo" src="/logo-carwash.webp" alt={config.nombre} />
      <div className="cw-card">
        <span className="cw-placa grande">{normPlaca(placa)}</span>
        {!o ? (
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
