import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AguaGasLayout from './modules/aguagas/Layout.jsx'
import Dashboard from './modules/aguagas/Dashboard.jsx'
import Inventario from './modules/aguagas/Inventario.jsx'
import Ventas from './modules/aguagas/Ventas.jsx'
import Balance from './modules/aguagas/Balance.jsx'
import CarwashLayout from './modules/carwash/Layout.jsx'
import CwDashboard from './modules/carwash/Dashboard.jsx'
import CwNuevaOrden from './modules/carwash/NuevaOrden.jsx'
import CwClientes from './modules/carwash/Clientes.jsx'
import CwServicios from './modules/carwash/Servicios.jsx'
import CwCaja from './modules/carwash/Caja.jsx'
import CwReportes from './modules/carwash/Reportes.jsx'
import CwAgenda from './modules/carwash/Agenda.jsx'
import CwConfig from './modules/carwash/Config.jsx'
import CwMas from './modules/carwash/Mas.jsx'
import CwSeguimiento from './modules/carwash/Seguimiento.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agua-gas" element={<AguaGasLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="balance" element={<Balance />} />
        </Route>
        <Route path="/carwash" element={<CarwashLayout />}>
          <Route index element={<CwDashboard />} />
          <Route path="orden" element={<CwNuevaOrden />} />
          <Route path="orden/:id" element={<CwNuevaOrden />} />
          <Route path="clientes" element={<CwClientes />} />
          <Route path="servicios" element={<CwServicios />} />
          <Route path="caja" element={<CwCaja />} />
          <Route path="reportes" element={<CwReportes />} />
          <Route path="agenda" element={<CwAgenda />} />
          <Route path="config" element={<CwConfig />} />
          <Route path="mas" element={<CwMas />} />
        </Route>
        <Route path="/carwash/estado/:placa" element={<CwSeguimiento />} />
      </Routes>
    </HashRouter>
  )
}
