import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Icon from './Icons.jsx'
import { CUENTAS, EGRESOS, soles } from './data.js'

const METODOS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta']

function Ticket() {
  return (
    <div className="cw-ticket">
      <img src="/logo-carwash.webp" alt="" />
      <b>CARWASH CAMPOS</b>
      <span>RUC 20000000000</span>
      <span>Av. Principal 123 · Trujillo</span>
      <hr />
      <div className="r"><span>Placa</span><b>ABC-123</b></div>
      <div className="r"><span>Lavado completo</span><span>25.00</span></div>
      <div className="r"><span>Encerado</span><span>30.00</span></div>
      <hr />
      <div className="r t"><span>TOTAL</span><b>S/ 55.00</b></div>
      <div className="r"><span>Yape</span><span>30.00</span></div>
      <div className="r"><span>Efectivo</span><span>25.00</span></div>
      <hr />
      <span>Fidelidad: visita 4 de 5</span>
      <span className="small">Sigue tu vehículo:</span>
      <span className="small">carwashcampos.com/estado/ABC-123</span>
      <span>¡Limpieza que te hace brillar!</span>
    </div>
  )
}

export default function Caja() {
  const [tab, setTab] = useState('caja')
  const [pagos, setPagos] = useState({ Efectivo: 25, Yape: 30, Plin: 0, Transferencia: 0, Tarjeta: 0 })
  const total = 55
  const pagado = Object.values(pagos).reduce((a, b) => a + Number(b || 0), 0)
  const falta = total - pagado

  return (
    <>
      <Cabecera titulo="Caja" subtitulo="Cobros, cuentas y gastos" />
      <div className="cw-content cw-overlap">
        <div className="cw-segmented">
          {[['caja', 'Caja del día'], ['cuentas', 'Por cobrar'], ['egresos', 'Gastos']].map(([id, t]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t}</button>
          ))}
        </div>

        {tab === 'caja' && (
          <div className="cw-caja-grid">
            <div>
              <div className="cw-card">
                <div className="cw-estado-caja"><span className="punto" /> Caja abierta · 07:00</div>
                <div className="cw-kpis dos">
                  <div className="cw-kpi"><span className="et">Monto inicial</span><span className="val">{soles(100)}</span></div>
                  <div className="cw-kpi"><span className="et">Efectivo esperado</span><span className="val">{soles(325)}</span></div>
                  <div className="cw-kpi"><span className="et">Digital (Yape, Plin, POS)</span><span className="val">{soles(225)}</span></div>
                  <div className="cw-kpi destacada"><span className="et">Ingresos de hoy</span><span className="val">{soles(450)}</span></div>
                </div>
                <button className="cw-btn oscuro">Cerrar caja (arqueo)</button>
              </div>

              <div className="cw-card">
                <h3>Cobrar orden · ABC-123</h3>
                <div className="cw-pagos">
                  {METODOS.map((m) => (
                    <div key={m} className="cw-campo">
                      <label>{m}</label>
                      <input type="number" inputMode="decimal" min="0" value={pagos[m]} onChange={(e) => setPagos({ ...pagos, [m]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className={`cw-falta${falta === 0 ? ' ok' : ''}`}>
                  {falta === 0 ? 'Pago completo' : falta > 0 ? `Falta ${soles(falta)}` : `Vuelto ${soles(-falta)}`}
                </div>
                <div className="cw-btn-fila">
                  <button className="cw-btn" disabled={falta > 0}>Cobrar {soles(total)}</button>
                  <button className="cw-btn ghost"><Icon name="imprimir" /> Ticket</button>
                </div>
              </div>
            </div>

            <div className="cw-card cw-ticket-card">
              <h3>Vista previa del ticket (80 mm)</h3>
              <Ticket />
            </div>
          </div>
        )}

        {tab === 'cuentas' && (
          <div className="cw-card">
            <h3>Clientes con crédito</h3>
            {CUENTAS.map((c) => (
              <div key={c.id} className="cw-fila plano">
                <div className="info">
                  <strong>{c.cliente}</strong>
                  <div className="cw-meta">{c.detalle} · hace {c.dias} días</div>
                </div>
                <div className="lado">
                  <b>{soles(c.monto)}</b>
                  <button className="cw-btn mini ghost"><Icon name="descargar" /> Estado</button>
                </div>
              </div>
            ))}
            <div className="cw-btn-fila">
              <button className="cw-btn ghost">Exportar PDF</button>
              <button className="cw-btn ghost">Exportar Excel</button>
            </div>
          </div>
        )}

        {tab === 'egresos' && (
          <div className="cw-card">
            <div className="cw-form-gasto">
              <div className="cw-campo"><label>Concepto</label><input placeholder="Ej. Compra de shampoo" /></div>
              <div className="cw-campo"><label>Monto (S/)</label><input type="number" inputMode="decimal" placeholder="0.00" /></div>
              <button className="cw-btn">Registrar gasto</button>
            </div>
            <h4 className="cw-sub">Últimos gastos</h4>
            {EGRESOS.map((g) => (
              <div key={g.id} className="cw-fila plano">
                <div className="info"><strong>{g.concepto}</strong><div className="cw-meta">{g.cat} · {g.fecha}</div></div>
                <b className="rojo">- {soles(g.monto)}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
