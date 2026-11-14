import { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import EditorItems from './EditorItems.jsx'
import { Campo } from './Ui.jsx'
import { useStore, acc, totalOrden } from './store.js'
import { CATEGORIAS, comprimirImagen, normPlaca, rellenar, linkWhatsApp, urlSeguimiento, uid } from './data.js'

function Firma({ valor, onChange }) {
  const ref = useRef(null)
  const dibujando = useRef(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0B1F3F'
  }, [valor])

  if (valor) {
    return (
      <div className="cw-firma">
        <img className="cw-firma-img" src={valor} alt="Firma del cliente" />
        <button type="button" className="cw-btn ghost mini" onClick={() => onChange(null)}>Borrar firma</button>
      </div>
    )
  }

  const pos = (e) => {
    const r = ref.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const inicio = (e) => {
    dibujando.current = true
    ref.current.setPointerCapture(e.pointerId)
    const ctx = ref.current.getContext('2d')
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  const mover = (e) => {
    if (!dibujando.current) return
    const ctx = ref.current.getContext('2d')
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  const fin = () => {
    if (!dibujando.current) return
    dibujando.current = false
    const c = ref.current
    const peque = document.createElement('canvas')
    peque.width = 300
    peque.height = Math.round((300 * c.height) / c.width)
    peque.getContext('2d').drawImage(c, 0, 0, peque.width, peque.height)
    onChange(peque.toDataURL('image/png'))
  }
  const limpiar = () => ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height)

  return (
    <div className="cw-firma">
      <canvas ref={ref} onPointerDown={inicio} onPointerMove={mover} onPointerUp={fin} onPointerLeave={fin} />
      <span className="hint">Firma del cliente aquí</span>
      <button type="button" className="cw-btn ghost mini" onClick={limpiar}>Borrar</button>
    </div>
  )
}

function Silueta({ marcas, setMarcas }) {
  const poner = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setMarcas([...marcas, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, id: uid() }])
  }
  return (
    <div className="cw-silueta" onClick={poner}>
      <svg viewBox="0 0 200 400" preserveAspectRatio="none" aria-label="Vista superior del vehículo">
        <path d="M60 30c0-14 80-14 80 0l10 70v200l-10 70c0 14-80 14-80 0l-10-70V100l10-70Z" fill="#fff" stroke="#0B1F3F" strokeWidth="3" />
        <path d="M68 110h64l6 46H62l6-46Z" fill="#DCE9FB" stroke="#0B1F3F" strokeWidth="2" />
        <path d="M64 250h72l5 44H59l5-44Z" fill="#DCE9FB" stroke="#0B1F3F" strokeWidth="2" />
        <rect x="30" y="92" width="16" height="34" rx="6" fill="#0B1F3F" />
        <rect x="154" y="92" width="16" height="34" rx="6" fill="#0B1F3F" />
        <rect x="30" y="274" width="16" height="34" rx="6" fill="#0B1F3F" />
        <rect x="154" y="274" width="16" height="34" rx="6" fill="#0B1F3F" />
      </svg>
      {marcas.map((m) => (
        <button key={m.id} type="button" className="marca" style={{ left: `${m.x}%`, top: `${m.y}%` }}
          onClick={(e) => { e.stopPropagation(); setMarcas(marcas.filter((x) => x.id !== m.id)) }} aria-label="Quitar marca">✕</button>
      ))}
    </div>
  )
}

export default function NuevaOrden() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation()
  const { ordenes, clientes, servicios, combos, config } = useStore()
  const existente = id ? ordenes.find((o) => o.id === id) : null
  const cita = state?.cita

  const [placa, setPlaca] = useState(existente?.placa || cita?.placa || '')
  const [marca, setMarca] = useState(existente?.marca || '')
  const [cat, setCat] = useState(existente?.cat || cita?.cat || 'auto')
  const [cliente, setCliente] = useState(existente?.cliente || { nombre: cita?.cliente || '', tel: cita?.tel || '', doc: '' })
  const [items, setItems] = useState(existente?.items || (cita?.servicio ? [{ key: uid(), tipo: 'extra', refId: '', nombre: cita.servicio, precio: 0, cant: 1 }] : []))
  const [descuento, setDescuento] = useState(existente?.descuento ?? '')
  const [estado, setEstado] = useState(existente?.estado || 'espera')
  const [foto, setFoto] = useState(existente?.foto || null)
  const [fotosDanio, setFotosDanio] = useState(existente?.fotosDanio || [])
  const [marcas, setMarcas] = useState(existente?.marcas || [])
  const [pert, setPert] = useState(existente?.pert || { documentos: false, radio: false, llanta: false, otros: false })
  const [firma, setFirma] = useState(existente?.firma || null)
  const [creada, setCreada] = useState(null)
  const [detalle, setDetalle] = useState(false)

  const conocido = clientes.find((c) => normPlaca(placa) && c.placas.map(normPlaca).includes(normPlaca(placa)))

  // Si la placa ya existe, se completan los datos del cliente
  useEffect(() => {
    if (existente || !conocido) return
    setCliente((c) => ({ nombre: c.nombre || conocido.nombre, tel: c.tel || conocido.tel, doc: c.doc || conocido.doc || '' }))
    setMarca((m) => m || conocido.marca || '')
  }, [conocido?.id]) // eslint-disable-line

  const cambiarCat = (nueva) => {
    setCat(nueva)
    setItems((prev) =>
      prev.map((it) => {
        const fuente = it.tipo === 'servicio' ? servicios : it.tipo === 'combo' ? combos : null
        const f = fuente && fuente.find((x) => x.id === it.refId)
        const p = f && Number(f.precios?.[nueva])
        return p > 0 ? { ...it, precio: p } : it
      })
    )
  }

  const leerFoto = async (file, cb) => {
    if (!file) return
    try { cb(await comprimirImagen(file)) } catch (e) { /* foto no válida */ }
  }

  const ciclo = conocido ? (conocido.visitas || 0) % 6 : 0
  const toca = conocido && ciclo === 5
  const gratis = () => {
    const base = items.find((i) => i.tipo === 'servicio' || i.tipo === 'combo')
    if (base) setDescuento(String(Number(base.precio) * Number(base.cant)))
  }

  const datos = () => ({
    placa: normPlaca(placa), marca: marca.trim(), cat, cliente: { nombre: cliente.nombre.trim(), tel: cliente.tel.trim(), doc: cliente.doc.trim() },
    items: items.map((i) => ({ ...i, precio: Number(i.precio) || 0, cant: Number(i.cant) || 1 })),
    descuento: Number(descuento) || 0, estado, foto, fotosDanio, marcas, pert, firma,
  })

  const listo = normPlaca(placa) && items.length > 0

  const guardar = () => {
    if (!listo) return
    if (existente) {
      acc.actualizarOrden(existente.id, datos())
      navigate('/carwash/caja')
    } else {
      setCreada(acc.crearOrden(datos()))
    }
  }

  if (id && !existente) {
    return (
      <>
        <Cabecera titulo="Ticket" subtitulo="No encontrado" />
        <div className="cw-content cw-overlap">
          <div className="cw-card centro">
            <p>Este ticket ya no existe.</p>
            <button className="cw-btn" onClick={() => navigate('/carwash/caja')}>Ir a Caja</button>
          </div>
        </div>
      </>
    )
  }

  if (creada) {
    const msg = rellenar(config.plantillas.ingreso, { nombre: creada.cliente.nombre || '', placa: creada.placa, link: urlSeguimiento(creada.placa) })
    return (
      <>
        <Cabecera titulo="Ticket creado" subtitulo={`N.º ${String(creada.numero).padStart(4, '0')} · ${creada.placa}`} />
        <div className="cw-content cw-overlap">
          <div className="cw-card centro">
            <div className="cw-ok"><Icon name="check" /></div>
            <h3>¡Ticket registrado!</h3>
            <p className="cw-nota">Ya aparece en el Inicio (patio) y en Caja, en "Por cobrar".</p>
            <div className="cw-btn-col">
              <button className="cw-btn" onClick={() => navigate('/carwash/caja')}>Ir a cobrar</button>
              {creada.cliente.tel && (
                <a className="cw-btn wa" href={linkWhatsApp(creada.cliente.tel, msg)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" /> Enviar seguimiento por WhatsApp</a>
              )}
              <button className="cw-btn ghost" onClick={() => navigate('/carwash')}>Ver el patio</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Cabecera titulo={existente ? `Editar ticket ${String(existente.numero).padStart(4, '0')}` : 'Nuevo ticket'} subtitulo="Cliente, vehículo y servicios" />
      <div className="cw-content cw-overlap">
        <div className="cw-orden-grid">
          <div className="cw-col-izq">
            <div className="cw-card">
              <h3>1 · Vehículo</h3>
              <Campo label="Placa">
                <input className="cw-placa-input" placeholder="ABC-123" value={placa} maxLength={8} onChange={(e) => setPlaca(e.target.value.toUpperCase())} autoCapitalize="characters" />
              </Campo>
              <div className="cw-fila-dos">
                <Campo label="Marca / modelo (opcional)"><input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Toyota Yaris" /></Campo>
                <div className="cw-campo">
                  <span className="cw-lbl">Foto de la placa</span>
                  <label className="cw-foto-btn">
                    <Icon name="camara" /> {foto ? 'Cambiar' : 'Tomar foto'}
                    <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => leerFoto(e.target.files[0], setFoto)} />
                  </label>
                </div>
              </div>
              {foto && <img className="cw-foto-prev" src={foto} alt="Foto del vehículo" />}
              <div className="cw-campo">
                <span className="cw-lbl">Tipo de vehículo</span>
                <div className="cw-cats">
                  {CATEGORIAS.map((c) => (
                    <button key={c.id} type="button" className={cat === c.id ? 'active' : ''} onClick={() => cambiarCat(c.id)}>
                      <span className="em">{c.emoji}</span>{c.corto}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cw-card">
              <h3>2 · Cliente</h3>
              {conocido && (
                <div className="cw-cliente-hallado">
                  <b>Cliente registrado</b>
                  <span className="cw-fide">Visita {ciclo} de 5 · {toca ? '¡le toca lavado gratis!' : 'el 6.º es gratis'}</span>
                </div>
              )}
              <Campo label="Nombre"><input value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} placeholder="Nombre del cliente" /></Campo>
              <div className="cw-fila-dos">
                <Campo label="Celular (WhatsApp)"><input type="tel" inputMode="tel" value={cliente.tel} onChange={(e) => setCliente({ ...cliente, tel: e.target.value })} placeholder="999 999 999" /></Campo>
                <Campo label="DNI / RUC"><input inputMode="numeric" value={cliente.doc} onChange={(e) => setCliente({ ...cliente, doc: e.target.value })} /></Campo>
              </div>
            </div>

            <div className="cw-card">
              <button type="button" className="cw-desplegar" onClick={() => setDetalle(!detalle)}>
                <h3>3 · Inspección de recepción <small>(opcional)</small></h3>
                <span>{detalle ? '▲' : '▼'}</span>
              </button>
              {detalle && (
                <>
                  <p className="cw-nota">Toca la silueta para marcar rayones o golpes previos. Toca una marca para quitarla.</p>
                  <Silueta marcas={marcas} setMarcas={setMarcas} />
                  <div className="cw-campo">
                    <span className="cw-lbl">Fotos de daños existentes (máx. 4)</span>
                    <div className="cw-fotos-danio">
                      {fotosDanio.map((f, i) => (
                        <button type="button" key={i} className="cw-mini-foto" onClick={() => setFotosDanio(fotosDanio.filter((_, k) => k !== i))} aria-label="Quitar foto"><img src={f} alt={`Daño ${i + 1}`} /></button>
                      ))}
                      {fotosDanio.length < 4 && (
                        <label className="cw-foto-mas">+<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => leerFoto(e.target.files[0], (u) => setFotosDanio([...fotosDanio, u]))} /></label>
                      )}
                    </div>
                  </div>
                  <div className="cw-campo">
                    <span className="cw-lbl">Pertenencias declaradas</span>
                    <div className="cw-checks">
                      {[['documentos', 'Documentos'], ['radio', 'Radio / frontal'], ['llanta', 'Llanta de repuesto'], ['otros', 'Otros objetos']].map(([k, t]) => (
                        <label key={k} className={pert[k] ? 'on' : ''}><input type="checkbox" checked={!!pert[k]} onChange={() => setPert({ ...pert, [k]: !pert[k] })} /> {t}</label>
                      ))}
                    </div>
                  </div>
                  <div className="cw-campo">
                    <span className="cw-lbl">Firma del cliente</span>
                    <Firma valor={firma} onChange={setFirma} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="cw-col-der">
            <div className="cw-card">
              <h3>{detalle ? '4' : '3'} · Servicios y productos</h3>
              <EditorItems items={items} setItems={setItems} cat={cat} descuento={descuento} setDescuento={setDescuento} aplicarGratis={toca ? gratis : null} />
            </div>

            <div className="cw-card">
              <h3>Estado del vehículo</h3>
              <div className="cw-segmented" style={{ marginBottom: 14 }}>
                <button type="button" className={estado === 'espera' ? 'active' : ''} onClick={() => setEstado('espera')}>En espera</button>
                <button type="button" className={estado === 'lavado' ? 'active' : ''} onClick={() => setEstado('lavado')}>En lavado</button>
                {existente && existente.estado === 'listo' && <button type="button" className={estado === 'listo' ? 'active' : ''} onClick={() => setEstado('listo')}>Listo</button>}
              </div>
              <div className="cw-total-grande"><span>Total a cobrar</span><b>S/ {totalOrden({ items, descuento }).toFixed(2)}</b></div>
              <button className="cw-btn grande" disabled={!listo} onClick={guardar}>{existente ? 'Guardar cambios' : 'Crear ticket'}</button>
              {!listo && <p className="cw-nota">Escribe la placa y agrega al menos un servicio.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
