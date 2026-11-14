const paths = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
  orden: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8" /><path d="M8 12h8" /></>,
  clientes: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 5a3.2 3.2 0 0 1 0 6.2" /><path d="M18 14.8c1.8.7 3 2.3 3.5 5.2" /></>,
  servicios: <><path d="M12 3c3 4 5.5 6.6 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9.600 9 7 12 3Z" /><path d="M9.500 14a2.600 2.600 0 0 0 2.500 2.500" /></>,
  caja: <><rect x="3" y="6" width="18" height="13" rx="2.500" /><path d="M3 10.500h18" /><path d="M7 15h3" /></>,
  reportes: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  agenda: <><rect x="3.500" y="5" width="17" height="15.500" rx="2.500" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3.500 10h17" /></>,
  config: <><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100" /></>,
  mas: <><circle cx="5.500" cy="12" r="1.600" /><circle cx="12" cy="12" r="1.600" /><circle cx="18.500" cy="12" r="1.600" /></>,
  salir: <><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9" /></>,
  camara: <><path d="M4 8h3l1.500-2.500h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3.500" /></>,
  whatsapp: <><path d="M4 20l1.200-4.100A8 8 0 1 1 8.200 18.900L4 20Z" /><path d="M9 9.500c.5 2.200 2.300 4 4.500 4.800l1.300-1.100-1.600-1-.8.600c-.8-.4-1.500-1.100-1.900-1.900l.6-.8-1-1.600L9 9.500Z" /></>,
  check: <path d="M5 12.500l4.500 4.500L19 7.500" />,
  flecha: <path d="M9 5l7 7-7 7" />,
  alerta: <><path d="M12 3.500 2.500 20h19L12 3.500Z" /><path d="M12 10v4.500" /><path d="M12 17.500v.1" /></>,
  imprimir: <><path d="M7 9V3.500h10V9" /><rect x="3.500" y="9" width="17" height="8" rx="2" /><path d="M7 14h10v6.500H7V14Z" /></>,
  descargar: <><path d="M12 4v11" /><path d="M7.500 11 12 15.500 16.500 11" /><path d="M5 20h14" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1" /></>,
}

export default function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
