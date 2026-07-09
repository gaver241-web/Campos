import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AguaGasLayout from './modules/aguagas/Layout.jsx'
import Dashboard from './modules/aguagas/Dashboard.jsx'
import Inventario from './modules/aguagas/Inventario.jsx'
import Ventas from './modules/aguagas/Ventas.jsx'
import Balance from './modules/aguagas/Balance.jsx'
import CarwashPlaceholder from './modules/carwash/Placeholder.jsx'

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
        <Route path="/carwash" element={<CarwashPlaceholder />} />
      </Routes>
    </HashRouter>
  )
}
