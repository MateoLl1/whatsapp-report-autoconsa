import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subscription } from 'rxjs'
import { ReportesWhatsappApiService } from '../../../services/reportes-whatsapp-api.service'
import { ReportePlantillaWhatsapp } from '../../../interfaces/reporte-plantilla-whatsapp.interface'

@Component({
  selector: 'app-reporte-whatsapp-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reporte-whatsapp-chat-page.component.html',
  styleUrl: './reporte-whatsapp-chat-page.component.css'
})
export class ReporteWhatsappChatPageComponent implements AfterViewInit, OnDestroy {

  numero = signal('')
  nombre = signal('')
  cargando = signal(false)
  error = signal<string | null>(null)
  mensajes = signal<ReportePlantillaWhatsapp[]>([])

  @ViewChild('contenedorMensajes') contenedorMensajes?: ElementRef<HTMLDivElement>

  private subs = new Subscription()
  private yaInicializadoScroll = false

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ReportesWhatsappApiService
  ) {
    const n = this.route.snapshot.paramMap.get('numero') ?? ''
    this.numero.set(n)
    this.cargar()
  }

  ngAfterViewInit() {
    this.yaInicializadoScroll = true
    this.bajarAlFinal()
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  cargar() {
    this.cargando.set(true)
    this.error.set(null)

    const sub = this.api.obtenerChat(this.numero()).subscribe({
      next: (r) => {
        const ordenados = [...r].sort((a, b) => {
          const ta = `${a.rpw_fecha} ${a.rpw_hora}`
          const tb = `${b.rpw_fecha} ${b.rpw_hora}`
          return ta.localeCompare(tb)
        })

        this.mensajes.set(ordenados)
        this.nombre.set(ordenados[0]?.rpw_nombre ?? '')
        this.cargando.set(false)

        queueMicrotask(() => this.bajarAlFinal())
        setTimeout(() => this.bajarAlFinal(), 0)
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'No se pudo cargar el chat')
        this.cargando.set(false)
      }
    })

    this.subs.add(sub)
  }

  bajarAlFinal() {
    if (!this.yaInicializadoScroll) return
    const el = this.contenedorMensajes?.nativeElement
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  formatearFecha(fecha: string) {
    return fecha?.slice(0, 10) ?? ''
  }

  esError(estado: string) {
    const e = (estado ?? '').toUpperCase()
    return e.includes('ERR') || e.includes('FAIL')
  }

  obtenerIniciales(nombre: string) {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
    const a = partes[0]?.[0] ?? ''
    const b = partes.length > 1 ? (partes[1]?.[0] ?? '') : (partes[0]?.[1] ?? '')
    return (a + b).toUpperCase()
  }

  textoMensaje(m: ReportePlantillaWhatsapp) {
    const msg = (m.rpw_mensaje ?? '').trim()
    if (msg.length > 0) return msg
    return (m.rpw_variable_json ?? '').trim()
  }
}