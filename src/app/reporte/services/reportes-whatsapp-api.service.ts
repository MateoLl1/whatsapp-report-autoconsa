import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'

import { ReportePlantillaWhatsapp } from '../interfaces/reporte-plantilla-whatsapp.interface'
import { FiltrosReporteWhatsapp } from '../interfaces/filtros-reporte-whatsapp.interface'
import { environment } from '../../../environments/environment'
import { RespuestaPaginada } from '../../shared/models/respuesta-paginada.model'

@Injectable({ providedIn: 'root' })
export class ReportesWhatsappApiService {

  private readonly base = `${environment.apiBaseUrl}/reportes/plantillas-whatsapp`

  constructor(private readonly http: HttpClient) {}

  consultar(filtros: FiltrosReporteWhatsapp): Observable<RespuestaPaginada<ReportePlantillaWhatsapp>> {
    let params = new HttpParams()

    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}`.length > 0) params = params.set(k, `${v}`)
    })

    return this.http.get<RespuestaPaginada<ReportePlantillaWhatsapp>>(this.base, { params })
  }

  obtenerDetalle(id: number): Observable<ReportePlantillaWhatsapp> {
    return this.http.get<ReportePlantillaWhatsapp>(`${this.base}/${id}`)
  }

  obtenerChat(numero: string): Observable<ReportePlantillaWhatsapp[]> {
    return this.http.get<ReportePlantillaWhatsapp[]>(`${this.base}/chat/${encodeURIComponent(numero)}`)
  }
}
