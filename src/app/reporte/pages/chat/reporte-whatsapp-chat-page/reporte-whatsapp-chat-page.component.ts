import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ReportePlantillaWhatsapp } from '../../../interfaces/reporte-plantilla-whatsapp.interface'
import { ReportesWhatsappApiService } from '../../../services/reportes-whatsapp-api.service'


@Component({
  selector: 'app-reporte-whatsapp-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reporte-whatsapp-chat-page.component.html',
  styleUrl: './reporte-whatsapp-chat-page.component.css'
})
export class ReporteWhatsappChatPageComponent {

  numero = signal('')
  nombre = signal('')
  cargando = signal(false)
  error = signal<string | null>(null)
  mensajes = signal<ReportePlantillaWhatsapp[]>([])

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ReportesWhatsappApiService
  ) {
    const n = this.route.snapshot.paramMap.get('numero') ?? ''
    this.numero.set(n)
    this.cargar()
  }

  cargar() {
    this.cargando.set(true)
    this.error.set(null)

    this.api.obtenerChat(this.numero()).subscribe({
      next: (r) => {
        this.mensajes.set(r)
        this.nombre.set(r[0]?.rpw_nombre ?? '')
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'No se pudo cargar el chat')
        this.cargando.set(false)
      }
    })
  }

  formatearFecha(fecha: string) {
    return fecha?.slice(0, 10) ?? ''
  }

  esError(estado: string) {
    const e = (estado ?? '').toUpperCase()
    return e.includes('ERR') || e.includes('FAIL')
  }
}
