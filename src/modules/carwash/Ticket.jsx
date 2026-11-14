import { useStore, totalOrden, subtotalItems } from './store.js'
import { soles, fechaCorta, urlSeguimiento, catNombre } from './data.js'

export default function Ticket({ orden }) {
  const { config } = useStore()
  const total = totalOrden(orden)
  const desc = Number(orden.descuento || 0)
  return (
    <div className="cw-ticket cw-print-area">
      <img src="/logo-carwash.webp" alt="" />
      <b>{config.nombre}</b>
      {config.ruc && <span>RUC {config.ruc}</span>}
      {config.direccion && <span>{config.direccion}</span>}
      {config.telefono && <span>Tel. {config.telefono}</span>}
      <hr />
      <div className="r"><span>Ticket N.º</span><b>{String(orden.numero).padStart(4, '0')}</b></div>
      <div className="r"><span>Fecha</span><span>{fechaCorta(orden.fecha)} {orden.hora}</span></div>
      <div className="r"><span>Placa</span><b>{orden.placa}</b></div>
      <div className="r"><span>Tipo</span><span>{catNombre(orden.cat)}</span></div>
      {orden.cliente?.nombre && <div className="r"><span>Cliente</span><span>{orden.cliente.nombre}</span></div>}
      <hr />
      {orden.items.map((i) => (
        <div key={i.key} className="r">
          <span>{i.cant > 1 ? `${i.cant} x ` : ''}{i.nombre}</span>
          <span>{(Number(i.precio) * Number(i.cant)).toFixed(2)}</span>
        </div>
      ))}
      <hr />
      {desc > 0 && <div className="r"><span>Subtotal</span><span>{subtotalItems(orden.items).toFixed(2)}</span></div>}
      {desc > 0 && <div className="r"><span>Descuento</span><span>-{desc.toFixed(2)}</span></div>}
      <div className="r t"><span>TOTAL</span><b>{soles(total)}</b></div>
      {orden.pagos?.map((p, i) => (
        <div key={i} className="r"><span>{p.metodo}</span><span>{Number(p.monto).toFixed(2)}</span></div>
      ))}
      {orden.credito && !orden.pagado && <span><b>A CRÉDITO · PENDIENTE</b></span>}
      <hr />
      <span className="small">Sigue tu vehículo:</span>
      <span className="small">{urlSeguimiento(orden.placa)}</span>
      {config.pie && <span>{config.pie}</span>}
    </div>
  )
}
