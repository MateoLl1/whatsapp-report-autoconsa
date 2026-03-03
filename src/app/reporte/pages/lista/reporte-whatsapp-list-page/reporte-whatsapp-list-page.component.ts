import { Component, OnDestroy, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs'
import { ReportesWhatsappApiService } from '../../../services/reportes-whatsapp-api.service'
import { ReportePlantillaWhatsapp } from '../../../interfaces/reporte-plantilla-whatsapp.interface'

type Conversacion = {
  numero: string
  nombre: string
  ultimoMensaje: string
  ultimaFecha: string
  ultimaHora: string
  estado: string
  plantilla: string
}

@Component({
  selector: 'app-reporte-whatsapp-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './reporte-whatsapp-list-page.component.html',
  styleUrl: './reporte-whatsapp-list-page.component.css'
})
export class ReporteWhatsappListPageComponent implements OnDestroy {

  iconoWhatsapp = faWhatsapp

  cargando = signal(false)
  error = signal<string | null>(null)

  busqueda = signal('')
  conversaciones = signal<Conversacion[]>([])
  conversacionSeleccionada = signal<Conversacion | null>(null)

  private cambiosBusqueda$ = new Subject<string>()
  private subs = new Subscription()

  constructor(private readonly api: ReportesWhatsappApiService) {
    this.subs.add(
      this.cambiosBusqueda$
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe((valor) => {
          const texto = valor.trim()
          if (texto.length === 0) {
            this.cargarConversaciones('')
            return
          }
          this.cargarConversaciones(texto)
        })
    )

    this.cargarConversaciones('')
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  onCambioBusqueda(valor: string) {
    this.busqueda.set(valor)
    this.cambiosBusqueda$.next(valor)
  }

  buscarManual() {
    this.cargarConversaciones(this.busqueda().trim())
  }

  cargarConversaciones(texto: string) {
    this.cargando.set(true)
    this.error.set(null)

    const filtros: any = {
      pagina: 1,
      limite: 200,
      ordenar_por: 'RPW_FECHA',
      orden: 'DESC'
    }

    if (texto.length > 0) filtros.busqueda = texto

    this.api.consultar(filtros).subscribe({
      next: (r) => {
        const convers = this.construirConversaciones(r.datos)
        this.conversaciones.set(convers)
        this.conversacionSeleccionada.set(convers[0] ?? null)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo cargar el listado')
        this.cargando.set(false)
      }
    })
  }

  private construirConversaciones(datos: ReportePlantillaWhatsapp[]): Conversacion[] {
    const mapa = new Map<string, Conversacion>()

    for (const item of datos) {
      const numero = item.rpw_numero
      const actual = mapa.get(numero)

      const texto = (item.rpw_mensaje && item.rpw_mensaje.trim().length > 0)
        ? item.rpw_mensaje
        : (item.rpw_variable_json && item.rpw_variable_json.trim().length > 0)
          ? item.rpw_variable_json
          : ''

      const registro: Conversacion = {
        numero,
        nombre: item.rpw_nombre,
        ultimoMensaje: texto,
        ultimaFecha: item.rpw_fecha,
        ultimaHora: item.rpw_hora,
        estado: item.rpw_estado,
        plantilla: item.rpw_nombre_plantilla
      }

      if (!actual) {
        mapa.set(numero, registro)
        continue
      }

      const tsActual = `${actual.ultimaFecha} ${actual.ultimaHora}`
      const tsNuevo = `${registro.ultimaFecha} ${registro.ultimaHora}`

      if (tsNuevo > tsActual) mapa.set(numero, registro)
    }

    return Array.from(mapa.values()).sort((a, b) => {
      const ta = `${a.ultimaFecha} ${a.ultimaHora}`
      const tb = `${b.ultimaFecha} ${b.ultimaHora}`
      return tb.localeCompare(ta)
    })
  }

  seleccionar(c: Conversacion) {
    this.conversacionSeleccionada.set(c)
  }

  formatearFecha(fecha: string) {
    return fecha?.slice(0, 10) ?? ''
  }

  recortar(texto: string, max = 44) {
    const t = (texto ?? '').replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    return t.slice(0, max) + '…'
  }

  obtenerIniciales(nombre: string) {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
    const a = partes[0]?.[0] ?? ''
    const b = partes.length > 1 ? (partes[1]?.[0] ?? '') : (partes[0]?.[1] ?? '')
    return (a + b).toUpperCase()
  }
}