export interface FiltrosReporteWhatsapp {
  busqueda?: string
  id_plantilla?: string
  nombre_plantilla?: string
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
  hora_desde?: string
  hora_hasta?: string
  pagina?: number
  limite?: number
  ordenar_por?: string
  orden?: 'ASC' | 'DESC'
}
