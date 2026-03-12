import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Subscription,
  distinctUntilChanged,
  map,
  forkJoin,
  of,
  catchError,
} from 'rxjs';
import { ReportePlantillaWhatsapp } from '../../../interfaces/reporte-plantilla-whatsapp.interface';
import { PlantillaCallbell } from '../../../interfaces/plantillas-callbell.interface';
import { ServicioPlantillasCallbell } from '../../../../core/services/plantillas-callbell.service';
import { ReportesWhatsappApiService } from '../../../services/reportes-whatsapp-api.service';

@Component({
  selector: 'app-reporte-whatsapp-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reporte-whatsapp-chat-page.component.html',
  styleUrl: './reporte-whatsapp-chat-page.component.css',
})
export class ReporteWhatsappChatPageComponent
  implements AfterViewInit, OnDestroy
{
  numero = signal('');
  nombre = signal('');
  cargando = signal(false);
  cargandoPlantillas = signal(false);
  error = signal<string | null>(null);
  mensajes = signal<ReportePlantillaWhatsapp[]>([]);
  plantillasPorUuid = signal<Record<string, PlantillaCallbell>>({});

  mensajeInfo = signal<ReportePlantillaWhatsapp | null>(null);

  @ViewChild('contenedorMensajes')
  contenedorMensajes?: ElementRef<HTMLDivElement>;

  private subs = new Subscription();
  private yaInicializadoScroll = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ReportesWhatsappApiService,
    private readonly plantillasCallbell: ServicioPlantillasCallbell,
  ) {
    this.subs.add(
      this.route.paramMap
        .pipe(
          map((p) => p.get('numero') ?? ''),
          distinctUntilChanged(),
        )
        .subscribe((n) => {
          this.numero.set(n);
          this.cargar();
        }),
    );
  }

  ngAfterViewInit() {
    this.yaInicializadoScroll = true;
    this.bajarAlFinal();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  cargar() {
    const n = this.numero().trim();
    if (!n) return;

    this.cargando.set(true);
    this.error.set(null);
    this.mensajes.set([]);
    this.nombre.set('');
    this.plantillasPorUuid.set({});
    this.mensajeInfo.set(null);

    const sub = this.api.obtenerChat(n).subscribe({
      next: (r) => {
        const ordenados = [...r].sort((a, b) => {
          const ta = `${a.rpw_fecha} ${a.rpw_hora}`;
          const tb = `${b.rpw_fecha} ${b.rpw_hora}`;
          return ta.localeCompare(tb);
        });

        this.mensajes.set(ordenados);
        this.nombre.set(ordenados[0]?.rpw_nombre ?? '');
        this.cargando.set(false);

        this.cargarPlantillasDeMensajes(ordenados);

        queueMicrotask(() => this.bajarAlFinal());
        setTimeout(() => this.bajarAlFinal(), 0);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'No se pudo cargar el chat');
        this.cargando.set(false);
      },
    });

    this.subs.add(sub);
  }

  cargarPlantillasDeMensajes(mensajes: ReportePlantillaWhatsapp[]) {
    const existentes = this.plantillasPorUuid();
    const uuids = Array.from(
      new Set(
        mensajes
          .map((m) => (m.rpw_uuid ?? '').trim())
          .filter((u) => u.length > 0),
      ),
    ).filter((u) => !existentes[u]);

    if (uuids.length === 0) return;

    this.cargandoPlantillas.set(true);

    const solicitudes = uuids.map((uuid) =>
      this.plantillasCallbell.obtenerPlantillaPorUuid(uuid).pipe(
        map((r) => ({ uuid, plantilla: r.template })),
        catchError(() =>
          of({ uuid, plantilla: null as unknown as PlantillaCallbell }),
        ),
      ),
    );

    const sub = forkJoin(solicitudes).subscribe({
      next: (resultados) => {
        const actualizado: Record<string, PlantillaCallbell> = {
          ...this.plantillasPorUuid(),
        };

        for (const r of resultados) {
          if (r?.plantilla?.uuid) {
            actualizado[r.uuid] = r.plantilla;
          }
        }

        this.plantillasPorUuid.set(actualizado);
        this.cargandoPlantillas.set(false);
      },
      error: () => {
        this.cargandoPlantillas.set(false);
      },
    });

    this.subs.add(sub);
  }

  abrirInfo(m: ReportePlantillaWhatsapp) {
    this.mensajeInfo.set(m);
  }

  cerrarInfo() {
    this.mensajeInfo.set(null);
  }

  plantillaDeMensaje(m: ReportePlantillaWhatsapp) {
    const uuid = (m.rpw_uuid ?? '').trim();
    if (!uuid) return null;
    return this.plantillasPorUuid()[uuid] ?? null;
  }

  bajarAlFinal() {
    if (!this.yaInicializadoScroll) return;
    const el = this.contenedorMensajes?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  formatearFecha(fecha: string) {
    return fecha?.slice(0, 10) ?? '';
  }

  esError(estado: string) {
    const e = (estado ?? '').toUpperCase();
    return e.includes('ERR') || e.includes('FAIL');
  }

  obtenerIniciales(nombre: string) {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
    const a = partes[0]?.[0] ?? '';
    const b =
      partes.length > 1 ? (partes[1]?.[0] ?? '') : (partes[0]?.[1] ?? '');
    return (a + b).toUpperCase();
  }

  textoMensaje(m: ReportePlantillaWhatsapp) {
    const uuid = (m.rpw_uuid ?? '').trim();
    const plantilla = uuid ? this.plantillasPorUuid()[uuid] : undefined;
    const textoPlantilla = (plantilla?.text ?? '').trim();

    if (textoPlantilla.length > 0) {
      const variables = this.leerVariablesDesdeJson(m.rpw_variable_json);
      return this.aplicarVariablesAPlantilla(textoPlantilla, variables);
    }

    const msg = (m.rpw_mensaje ?? '').trim();
    if (msg.length > 0) return msg;

    return (m.rpw_variable_json ?? '').trim();
  }

  leerVariablesDesdeJson(valor: string): string[] {
    const crudo = (valor ?? '').trim();
    if (!crudo) return [];

    try {
      const json = JSON.parse(crudo) as unknown;
      if (Array.isArray(json)) return json.map((v) => String(v ?? ''));
      return [];
    } catch {
      return [];
    }
  }

  aplicarVariablesAPlantilla(texto: string, variables: string[]): string {
    let resultado = texto;

    for (let i = 0; i < variables.length; i++) {
      const indice = i + 1;
      const patron = new RegExp(`\\{\\{\\s*${indice}\\s*\\}\\}`, 'g');
      resultado = resultado.replace(patron, variables[i] ?? '');
    }

    return resultado;
  }
}
