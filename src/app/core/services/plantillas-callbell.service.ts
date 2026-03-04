import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaPlantillaCallbell } from '../../reporte/interfaces/plantillas-callbell.interface';


@Injectable({ providedIn: 'root' })
export class ServicioPlantillasCallbell {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;


  obtenerPlantillaPorUuid(uuid: string): Observable<RespuestaPlantillaCallbell> {
    const url = `${this.baseUrl}/callbell/plantillas/${encodeURIComponent(uuid)}`;
    return this.http.get<RespuestaPlantillaCallbell>(url);
  }
}
