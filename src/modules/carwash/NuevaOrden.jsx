import { useRef, useState, useEffect } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { CATEGORIAS, SERVICIOS, CLIENTES, soles } from './data.js'

function Firma() {
  const ref = useRef(null)
  const dibujando = useRef(false)
  const [vacia, setVacia] = useState(true)

  useEffect(() => {
    const c = ref.current
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0B1F3F'
  }, [])

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
    setVacia(false)
  }
  const fin = () => { dibujando.current = false }
  const limpiar = () => {
    const c = ref.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setVacia(true)
  }

  return (
    <div className="cw-firma">
      <canvas ref={ref} onPointerDown={inicio} onPointerMove={mover} onPointerUp={fin} onPointerLeave={fin} />
      {vacia && <span className="hint">Firma del cliente aquí</span>}
      <button type="button" className="cw-btn ghost mini" onClick={limpiar}>Borrar</button>
    </div>
  )
}

function Silueta({ marcas, setMarcas }) {
  const poner = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setMarcas([...marcas, { x, y, id: Date.now() }])
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
        <button
          key={m.id}
          type="button"
          className="marca"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          onClick={(e) => { e.stopPropagation(); setMarcas(marcas.filter((x) => x.id !== m.id)) }}
          aria-label="Quitar marca"
        >
          ✕
        </button>
      ))}
    </div>
  )
}

export default function NuevaOrden() {
  const [placa, setPlaca] = useState('')
  const [cat, setCat] = useState('auto')
  const [sel, setSel] = useState(['s2'])
  const [marcas, setMarcas] = useState([])
  const [foto, setFoto] = useState(null)
  const [fotosDanio, setFotosDanio] = useState([])
  const [pert, setPert] = useState({ documentos: false, radio: false, llanta: false, otros: false })
  const [enviado, setEnviado] = useState(false)

  const cliente = CLIENTES.find((c) => c.placas.includes(placa.toUpperCase()))
  const total = SERVICIOS.filter((s) => sel.includes(s.id)).reduce((a, s) => a + s.precios[cat], 0)
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  const leer = (file, cb) => { if (file) cb(URL.createObjectURL(file)) }

  if (enviado) {
    return (
      <>
        <Cabecera titulo="Orden creada" subtitulo={placa || 'Sin placa'} />
        <div className="cw-content cw-overlap">
          <div className="cw-card centro">
            <div className="cw-ok"><Icon name="check" /></div>
            <h3>¡Orden registrada!</h3>
            <p className="cw-nota">Diseño de ejemplo: aquí se mostraría el enlace de seguimiento y el botón para enviarlo por WhatsApp.</p>
            <div className="cw-link"><Icon name="link" /> carwashcampos.com/estado/{(placa || 'ABC-123').toUpperCase()}</div>
            <button className="cw-btn" onClick={() => setEnviado(false)}>Nueva orden</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Cabecera titulo="Nueva orden" subtitulo="Recepción del vehículo" />
      <div className="cw-content cw-overlap">
        <div className="cw-orden-grid">
          <div className="cw-col-izq">
            <div className="cw-card">
              <h3>1 · Vehículo</h3>
              <div className="cw-campo">
                <label htmlFor="placa">Placa</label>
                <input id="placa" className="cw-placa-input" placeholder="ABC-123" value={placa} maxLength={8}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())} autoCapitalize="characters" />
              </div>
              {cliente && (
                <div className="cw-cliente-hallado">
                  <b>{cliente.nombre}</b>
                  <span>{cliente.marca} · {cliente.tel}</span>
                  <span className="cw-fide">Visita {Math.min(cliente.visitas % 6, 5)} de 5 · el 6.º es gratis</span>
                </div>
              )}
              <div className="cw-campo">
                <label>Foto de la placa o frente</label>
                <label className="cw-foto-btn">
                  <Icon name="camara" /> {foto ? 'Cambiar foto' : 'Tomar foto'}
                  <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => leer(e.target.files[0], setFoto)} />
                </label>
                {foto && <img className="cw-foto-prev" src={foto} alt="Foto del vehículo" />}
              </div>
              <div className="cw-campo">
                <label>Tipo de vehículo</label>
                <div className="cw-cats">
                  {CATEGORIAS.map((c) => (
                    <button key={c.id} type="button" className={cat === c.id ? 'active' : ''} onClick={() => setCat(c.id)}>
                      <span className="em">{c.emoji}</span>
                      {c.corto}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cw-card">
              <h3>2 · Inspección de recepción</h3>
              <p className="cw-nota">Toca la silueta para marcar rayones o golpes previos. Toca una marca para quitarla.</p>
              <Silueta marcas={marcas} setMarcas={setMarcas} />
              <div className="cw-campo">
                <label>Fotos de daños existentes (máx. 4)</label>
                <div className="cw-fotos-danio">
                  {fotosDanio.map((f, i) => <img key={i} src={f} alt={`Daño ${i + 1}`} />)}
                  {fotosDanio.length < 4 && (
                    <label className="cw-foto-mas">
                      +
                      <input type="file" accept="image/*" capture="environment" hidden
                        onChange={(e) => leer(e.target.files[0], (u) => setFotosDanio([...fotosDanio, u]))} />
                    </label>
                  )}
                </div>
              </div>
              <div className="cw-campo">
                <label>Pertenencias declaradas</label>
                <div className="cw-checks">
                  {[['documentos', 'Documentos'], ['radio', 'Radio / frontal'], ['llanta', 'Llanta de repuesto'], ['otros', 'Otros objetos']].map(([k, t]) => (
                    <label key={k} className={pert[k] ? 'on' : ''}>
                      <input type="checkbox" checked={pert[k]} onChange={() => setPert({ ...pert, [k]: !pert[k] })} /> {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="cw-campo">
                <label>Firma del cliente</label>
                <Firma />
              </div>
            </div>
          </div>

          <div className="cw-col-der">
            <div className="cw-card">
              <h3>3 · Servicios</h3>
              <div className="cw-servicios-lista">
                {SERVICIOS.filter((s) => s.precios[cat] > 0).map((s) => (
                  <button key={s.id} type="button" className={sel.includes(s.id) ? 'on' : ''} onClick={() => toggle(s.id)}>
                    <span className="chk">{sel.includes(s.id) && <Icon name="check" />}</span>
                    <span className="n">{s.nombre}</span>
                    <b>{soles(s.precios[cat])}</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="cw-card cw-resumen">
              <h3>Resumen</h3>
              <div className="fila"><span>Subtotal</span><b>{soles(total)}</b></div>
              <div className="fila"><span>Descuento</span><b>{soles(0)}</b></div>
              <div className="fila total"><span>Total</span><b>{soles(total)}</b></div>
              <button className="cw-btn grande" disabled={!placa || sel.length === 0} onClick={() => setEnviado(true)}>
                Crear orden
              </button>
              {!placa && <p className="cw-nota">Escribe la placa para continuar.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
