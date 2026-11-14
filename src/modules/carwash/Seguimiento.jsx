import { useParams } from 'react-router-dom'

const PASOS = ['En cola', 'Lavando', 'Acabado', '¡Listo para recoger!']

export default function Seguimiento() {
  const { placa } = useParams()
  const actual = 1
  return (
    <div className="cw-publico">
      <img className="logo" src="/logo-carwash.webp" alt="Carwash Campos" />
      <div className="cw-card">
        <span className="cw-placa grande">{placa}</span>
        <h3>Tu vehículo se está lavando</h3>
        <ol className="cw-pasos">
          {PASOS.map((p, i) => (
            <li key={p} className={i < actual ? 'hecho' : i === actual ? 'ahora' : ''}>
              <span className="n">{i < actual ? '✓' : i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <h4 className="cw-sub">Servicios</h4>
        <div className="cw-fila plano"><span>Lavado completo</span><b>S/ 25.00</b></div>
        <div className="cw-fila plano"><span>Encerado</span><b>S/ 30.00</b></div>
        <p className="cw-nota">Av. Principal 123 · Trujillo<br />Teléfono 999 999 999</p>
      </div>
    </div>
  )
}
