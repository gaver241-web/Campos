import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import Ticket from './Ticket.jsx'
import EditorItems from './EditorItems.jsx'
import { Modal, Campo, BotonesFila, confirmar } from './Ui.jsx'
import { useStore, acc, totalOrden } from './store.js'
import { METODOS, ESTADOS, soles, hoy, fechaCorta, catEmoji, descargarCSV, rellenar, linkWhatsApp } from './data.js'

const resumen = (o) => o.items.map((i) => (i.cant > 1 ? `${i.cant} ${i.nombre}` : i.nombre)).join(', ')
const vacioPagos = () => Object.fromEntries(METODOS.map((m) => [m, '']))

function VerTicket({ id, onClose }) {
  const { ordenes } = useStore()
  const o = ordenes.find((x) => x.id === id)
  if (!o) return null
  return (
    <Modal titulo="Ticket" onClose={onClose}>
      <div className="cw-ticket-modal"><Ticket orden={o} /></div>
      <div className="cw-btn-fila">
        <button className="cw-btn" onClick={() => window.print()}><Icon name="imprimir" /> Imprimir</button>
        <button className="cw-btn ghost" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  )
}

// Cobro: permite agregar/quitar servicios y productos y pagar con varios métodos
function Cobro({ id, onClose, onCobrado }) {
  const { ordenes } = useStore()
  const o = ordenes.find((x) => x.id === id)
  const [items, setItems] = useState(o?.items || [])
  const [descuento, setDescuento] = useState(o?.descuento ? String(o.descuento) : '')
  const [pagos, setPagos] = useState(vacioPagos())
  if (!o) return null

  const esCredito = o.credito && !o.pagado
  const total = esCredito ? totalOrden(o) : totalOrden({ items, descuento })
  const pagado = METODOS.reduce((a, m) => a + (Number(pagos[m]) || 0), 0)
  const diff = Math.round((pagado - total) * 100) / 100
  const efectivo = Number(pagos.Efectivo) || 0
  const vueltoOk = diff <= 0 || efectivo >= diff
  const puede = total === 0 || (diff >= 0 && vueltoOk)

  const llenar = (m) => setPagos({ ...vacioPagos(), [m]: total.toFixed(2) })

  const netos = () => {
    let sobra = diff > 0 ? diff : 0
    return METODOS.map((m) => {
      let monto = Number(pagos[m]) || 0
      if (m === 'Efectivo') { monto -= sobra; sobra = 0 }
      return { metodo: m, monto: Math.round(monto * 100) / 100 }
    }).filter((p) => p.monto > 0)
  }

  const cobrar = () => {
    if (!puede) return
    if (!esCredito) acc.actualizarOrden(o.id, { items: items.map((i) => ({ ...i, precio: Number(i.precio) || 0, cant: Number(i.cant) || 1 })), descuento: Number(descuento) || 0 })
    if (esCredito) acc.cobrarCredito(o.id, netos())
    else acc.terminar(o.id, { pagos: netos() })
    onCobrado(o.id)
  }
  const aCredito = () => {
    acc.actualizarOrden(o.id, { items: items.map((i) => ({ ...i, precio: Number(i.precio) || 0, cant: Number(i.cant) || 1 })), descuento: Number(descuento) || 0 })
    acc.terminar(o.id, { credito: true })
    onClose()
  }

  return (
    <Modal titulo={`Cobrar · ${o.placa}`} onClose={onClose} ancho="grande">
      <div className="cw-meta" style={{ marginBottom: 10 }}>
        Ticket {String(o.numero).padStart(4, '0')}{o.cliente?.nombre ? ` · ${o.cliente.nombre}` : ''}
      </div>
      {esCredito ? (
        <div className="cw-resumen-lineas">{o.items.map((i) => <div key={i.key} className="fila"><span>{i.cant} × {i.nombre}</span><b>{soles(i.precio * i.cant)}</b></div>)}</div>
      ) : (
        <EditorItems items={items} setItems={setItems} cat={o.cat} descuento={descuento} setDescuento={setDescuento} />
      )}

      <h4 className="cw-sub">Forma de pago</h4>
      <div className="cw-rapido">
        {METODOS.map((m) => <button key={m} type="button" onClick={() => llenar(m)}>Todo {m}</button>)}
      </div>
      <div className="cw-pagos">
        {METODOS.map((m) => (
          <Campo key={m} label={m}>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={pagos[m]} placeholder="0.00" onChange={(e) => setPagos({ ...pagos, [m]: e.target.value })} />
          </Campo>
        ))}
      </div>
      <div className={`cw-falta${diff >= 0 && vueltoOk ? ' ok' : ''}`}>
        {total === 0 ? 'Sin monto a cobrar' : diff < 0 ? `Falta ${soles(-diff)}` : diff > 0 ? (vueltoOk ? `Vuelto ${soles(diff)}` : 'El vuelto debe salir del efectivo') : 'Pago completo'}
      </div>
      <button className="cw-btn grande" disabled={!puede} onClick={cobrar}>Cobrar {soles(total)}</button>
      {!esCredito && o.cliente?.nombre && (
        <button className="cw-btn ghost" onClick={aCredito}>Dejar a crédito (cobrar después)</button>
      )}
    </Modal>
  )
}

function FormGasto({ inicial, onClose }) {
  const [f, setF] = useState({ concepto: '', cat: 'Insumos', monto: '', fecha: hoy(), ...inicial })
  const set = (k, v) => setF({ ...f, [k]: v })
  const guardar = () => {
    if (!f.concepto.trim() || !(Number(f.monto) > 0)) return
    acc.guardar('egresos', { ...f, concepto: f.concepto.trim(), monto: Number(f.monto), ts: f.ts || Date.now() })
    onClose()
  }
  return (
    <Modal titulo={inicial ? 'Editar gasto' : 'Nuevo gasto'} onClose={onClose}>
      <Campo label="Concepto"><input value={f.concepto} onChange={(e) => set('concepto', e.target.value)} placeholder="Ej. Compra de shampoo" autoFocus /></Campo>
      <Campo label="Categoría">
        <select value={f.cat} onChange={(e) => set('cat', e.target.value)}>
          {['Insumos', 'Servicios', 'Mantenimiento', 'Sueldos', 'Otros'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Campo>
      <div className="cw-fila-dos">
        <Campo label="Monto (S/)"><input type="number" inputMode="decimal" min="0" step="0.01" value={f.monto} onChange={(e) => set('monto', e.target.value)} /></Campo>
        <Campo label="Fecha"><input type="date" value={f.fecha} onChange={(e) => set('fecha', e.target.value)} /></Campo>
      </div>
      <button className="cw-btn" onClick={guardar}>Guardar</button>
    </Modal>
  )
}

function CajaDia() {
  const { caja, ordenes, egresos, cierres } = useStore()
  const [inicial, setInicial] = useState('')
  const [real, setReal] = useState('')

  if (!caja.abierta) {
    return (
      <>
        <div className="cw-card">
          <h3>Abrir caja</h3>
          <p className="cw-nota">Anota con cuánto efectivo empiezas el día.</p>
          <Campo label="Monto inicial (S/)"><input type="number" inputMode="decimal" min="0" step="0.01" value={inicial} onChange={(e) => setInicial(e.target.value)} placeholder="0.00" /></Campo>
          <button className="cw-btn" onClick={() => acc.abrirCaja(inicial)}>Abrir caja</button>
        </div>
        <Cierres cierres={cierres} />
      </>
    )
  }

  const pagosDesde = ordenes.filter((o) => o.pagado && (o.pagoTs || 0) >= caja.desde).flatMap((o) => o.pagos)
  const suma = (f) => pagosDesde.filter(f).reduce((a, p) => a + p.monto, 0)
  const cash = suma((p) => p.metodo === 'Efectivo')
  const digital = suma((p) => p.metodo !== 'Efectivo')
  const gastos = egresos.filter((g) => (g.ts || 0) >= caja.desde).reduce((a, g) => a + g.monto, 0)
  const esperado = caja.inicial + cash - gastos
  const dif = real === '' ? null : Math.round((Number(real) - esperado) * 100) / 100

  const cerrar = () => {
    if (real === '' || !confirmar('¿Cerrar la caja?')) return
    acc.cerrarCaja({ inicial: caja.inicial, efectivo: cash, digital, gastos, esperado, real: Number(real), diferencia: dif })
    setReal('')
  }

  return (
    <>
      <div className="cw-card">
        <div className="cw-estado-caja"><span className="punto" /> Caja abierta desde las {new Date(caja.desde).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
        <div className="cw-kpis dos">
          <div className="cw-kpi"><span className="et">Monto inicial</span><span className="val">{soles(caja.inicial)}</span></div>
          <div className="cw-kpi"><span className="et">Cobrado en efectivo</span><span className="val">{soles(cash)}</span></div>
          <div className="cw-kpi"><span className="et">Digital (Yape, Plin, POS…)</span><span className="val">{soles(digital)}</span></div>
          <div className="cw-kpi"><span className="et">Gastos desde la apertura</span><span className="val rojo">{soles(gastos)}</span></div>
          <div className="cw-kpi destacada"><span className="et">Efectivo esperado en caja</span><span className="val">{soles(esperado)}</span></div>
        </div>
        <Campo label="Efectivo contado (S/)"><input type="number" inputMode="decimal" min="0" step="0.01" value={real} onChange={(e) => setReal(e.target.value)} placeholder="0.00" /></Campo>
        {dif !== null && <div className={`cw-falta${dif === 0 ? ' ok' : ''}`}>{dif === 0 ? 'Cuadra perfecto' : dif > 0 ? `Sobran ${soles(dif)}` : `Faltan ${soles(-dif)}`}</div>}
        <button className="cw-btn oscuro" disabled={real === ''} onClick={cerrar}>Cerrar caja (arqueo)</button>
      </div>
      <Cierres cierres={cierres} />
    </>
  )
}

function Cierres({ cierres }) {
  if (!cierres.length) return null
  return (
    <div className="cw-card">
      <h3>Cierres anteriores</h3>
      {cierres.map((c) => (
        <div key={c.id} className="cw-fila plano">
          <div className="info">
            <strong>{fechaCorta(c.fecha)} · {c.hora}</strong>
            <div className="cw-meta">Esperado {soles(c.esperado)} · contado {soles(c.real)} · digital {soles(c.digital)}</div>
          </div>
          <div className="lado">
            <b className={c.diferencia < 0 ? 'rojo' : c.diferencia > 0 ? 'verde' : ''}>{c.diferencia === 0 ? 'Cuadra' : soles(c.diferencia)}</b>
            <BotonesFila onBorrar={() => confirmar('¿Borrar este cierre?') && acc.borrar('cierres', c.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Caja() {
  const navigate = useNavigate()
  const { ordenes, egresos, config } = useStore()
  const [tab, setTab] = useState('cobrar')
  const [cobrando, setCobrando] = useState(null)
  const [viendo, setViendo] = useState(null)
  const [gasto, setGasto] = useState(null)
  const [filtroCobrados, setFiltroCobrados] = useState('hoy')

  const porCobrar = ordenes.filter((o) => !o.pagado && !o.credito).sort((a, b) => b.ts - a.ts)
  const credito = ordenes.filter((o) => o.credito && !o.pagado).sort((a, b) => b.ts - a.ts)
  const cobrados = ordenes.filter((o) => o.pagado && (filtroCobrados === 'todos' || o.fechaPago === hoy())).sort((a, b) => (b.pagoTs || 0) - (a.pagoTs || 0))

  const porClienteCredito = credito.reduce((m, o) => {
    const k = o.cliente?.nombre || o.placa
    ;(m[k] = m[k] || []).push(o)
    return m
  }, {})

  const estadoCuenta = (nombre, lista) =>
    descargarCSV(`estado-de-cuenta-${nombre}.csv`, [
      ['Cliente', nombre], [],
      ['Ticket', 'Fecha', 'Placa', 'Detalle', 'Total'],
      ...lista.map((o) => [String(o.numero).padStart(4, '0'), fechaCorta(o.fecha), o.placa, resumen(o), totalOrden(o).toFixed(2)]),
      [], ['TOTAL', '', '', '', lista.reduce((a, o) => a + totalOrden(o), 0).toFixed(2)],
    ])

  const avisoListo = (o) =>
    o.cliente?.tel ? linkWhatsApp(o.cliente.tel, rellenar(config.plantillas.listo, { nombre: o.cliente.nombre || '', placa: o.placa, link: '' })) : null

  return (
    <>
      <Cabecera titulo="Caja" subtitulo="Por cobrar, cobrados, crédito y gastos" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented cinco">
          {[['cobrar', 'Por cobrar', porCobrar.length], ['cobrados', 'Cobrados'], ['credito', 'Crédito', credito.length], ['gastos', 'Gastos'], ['caja', 'Caja']].map(([id, t, n]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t}{n ? <b>{n}</b> : null}</button>
          ))}
        </div>

        {tab === 'cobrar' && (
          <>
            {porCobrar.length === 0 && (
              <div className="cw-card centro">
                <p>No hay tickets por cobrar.</p>
                <button className="cw-btn" onClick={() => navigate('/carwash/orden')}>Crear ticket</button>
              </div>
            )}
            <div className="cw-lista-tickets">
              {porCobrar.map((o) => (
                <div key={o.id} className="cw-card cw-tk">
                  <div className="cab">
                    <div>
                      <span className="cw-placa">{o.placa}</span>
                      <div className="cw-meta">N.º {String(o.numero).padStart(4, '0')} · {o.hora} · {catEmoji(o.cat)}{o.cliente?.nombre ? ` · ${o.cliente.nombre}` : ''}</div>
                    </div>
                    <b className="monto">{soles(totalOrden(o))}</b>
                  </div>
                  <div className="cw-meta det">{resumen(o)}</div>
                  <div className="cw-estados">
                    {['espera', 'lavado', 'listo'].map((e) => (
                      <button key={e} className={`${e}${o.estado === e ? ' on' : ''}`} onClick={() => acc.cambiarEstado(o.id, e)}>{ESTADOS[e]}</button>
                    ))}
                  </div>
                  <div className="cw-btn-fila">
                    <button className="cw-btn" onClick={() => setCobrando(o.id)}>Cobrar</button>
                    <button className="cw-btn ghost" onClick={() => navigate(`/carwash/orden/${o.id}`)}>Editar</button>
                    <button className="cw-btn ghost peligro" onClick={() => confirmar(`¿Borrar el ticket ${o.placa}?`) && acc.borrarOrden(o.id)} aria-label="Borrar"><Icon name="borrar" /></button>
                  </div>
                  {o.estado === 'listo' && avisoListo(o) && (
                    <a className="cw-btn wa mini" href={avisoListo(o)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" /> Avisar que está listo</a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'cobrados' && (
          <div className="cw-card">
            <div className="cw-chips" style={{ paddingBottom: 8 }}>
              <button className={filtroCobrados === 'hoy' ? 'active' : ''} onClick={() => setFiltroCobrados('hoy')}>Hoy</button>
              <button className={filtroCobrados === 'todos' ? 'active' : ''} onClick={() => setFiltroCobrados('todos')}>Todos</button>
            </div>
            {cobrados.length === 0 && <p className="cw-vacio">Sin tickets cobrados.</p>}
            {cobrados.map((o) => (
              <div key={o.id} className="cw-fila plano">
                <div className="info">
                  <strong>{o.placa} <span className="cw-chip verde">Terminado</span></strong>
                  <div className="cw-meta">{fechaCorta(o.fechaPago)} · {resumen(o)}</div>
                  <div className="cw-meta">{o.pagos.map((p) => `${p.metodo} ${soles(p.monto)}`).join(' · ')}</div>
                </div>
                <div className="lado">
                  <b>{soles(totalOrden(o))}</b>
                  <div className="cw-iconos">
                    <button className="cw-icbtn" onClick={() => setViendo(o.id)} aria-label="Ver ticket"><Icon name="imprimir" /></button>
                    <button className="cw-icbtn" onClick={() => confirmar('¿Reabrir este ticket? Volverá a "Por cobrar" y se devuelve el stock.') && acc.reabrirOrden(o.id)} aria-label="Reabrir"><Icon name="editar" /></button>
                    <button className="cw-icbtn peligro" onClick={() => confirmar('¿Borrar este ticket cobrado? Se devuelve el stock.') && acc.borrarOrden(o.id)} aria-label="Borrar"><Icon name="borrar" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'credito' && (
          <>
            {credito.length === 0 && <div className="cw-card centro"><p>No hay cuentas por cobrar a crédito.</p><p className="cw-nota">Al cobrar un ticket con cliente puedes dejarlo "a crédito".</p></div>}
            {Object.entries(porClienteCredito).map(([nombre, lista]) => (
              <div key={nombre} className="cw-card">
                <div className="cw-fila plano" style={{ paddingTop: 0 }}>
                  <div className="info"><strong>{nombre}</strong><div className="cw-meta">{lista.length} servicio(s) pendientes</div></div>
                  <div className="lado">
                    <b>{soles(lista.reduce((a, o) => a + totalOrden(o), 0))}</b>
                    <button className="cw-btn mini ghost" onClick={() => estadoCuenta(nombre, lista)}><Icon name="descargar" /> Estado</button>
                  </div>
                </div>
                {lista.map((o) => (
                  <div key={o.id} className="cw-fila plano">
                    <div className="info"><strong>{o.placa}</strong><div className="cw-meta">{fechaCorta(o.fecha)} · {resumen(o)}</div></div>
                    <div className="lado">
                      <b>{soles(totalOrden(o))}</b>
                      <button className="cw-btn mini" onClick={() => setCobrando(o.id)}>Cobrar</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {tab === 'gastos' && (
          <div className="cw-card">
            <button className="cw-btn" style={{ marginTop: 0 }} onClick={() => setGasto({})}>+ Registrar gasto</button>
            <h4 className="cw-sub">Gastos registrados</h4>
            {egresos.length === 0 && <p className="cw-vacio">Aún no hay gastos.</p>}
            {[...egresos].sort((a, b) => (b.ts || 0) - (a.ts || 0)).map((g) => (
              <div key={g.id} className="cw-fila plano">
                <div className="info"><strong>{g.concepto}</strong><div className="cw-meta">{g.cat} · {fechaCorta(g.fecha)}</div></div>
                <div className="lado">
                  <b className="rojo">- {soles(g.monto)}</b>
                  <BotonesFila onEditar={() => setGasto(g)} onBorrar={() => confirmar('¿Borrar este gasto?') && acc.borrar('egresos', g.id)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'caja' && <CajaDia />}
      </div>

      {cobrando && <Cobro id={cobrando} onClose={() => setCobrando(null)} onCobrado={(id) => { setCobrando(null); setViendo(id) }} />}
      {viendo && <VerTicket id={viendo} onClose={() => setViendo(null)} />}
      {gasto && <FormGasto inicial={gasto.id ? gasto : null} onClose={() => setGasto(null)} />}
    </>
  )
}
