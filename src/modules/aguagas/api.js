const BASE = '/api/aguagas'

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error('Error de red: ' + res.status)
  return res.json()
}

export const api = {
  getProductos: () => req('/productos'),
  crearProducto: (data) => req('/productos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarProducto: (id, data) => req(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarProducto: (id) => req(`/productos/${id}`, { method: 'DELETE' }),

  getCompras: () => req('/compras'),
  registrarCompra: (data) => req('/compras', { method: 'POST', body: JSON.stringify(data) }),

  getVentas: () => req('/ventas'),
  crearVenta: (data) => req('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarVenta: (id, data) => req(`/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarVenta: (id) => req(`/ventas/${id}`, { method: 'DELETE' }),
}
