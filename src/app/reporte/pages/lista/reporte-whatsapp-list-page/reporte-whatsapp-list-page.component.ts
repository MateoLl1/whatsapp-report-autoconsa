import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReportesWhatsappApiService } from '../../../services/reportes-whatsapp-api.service';
import { ReportePlantillaWhatsapp } from '../../../interfaces/reporte-plantilla-whatsapp.interface';
import { Conversacion } from '../../../interfaces/conversacion.interface';
import { ServicioTema } from '../../../../core/services/tema.service';

type EstadoFiltro = '' | 'Enviado' | 'ERR_BAD_REQUEST' | 'ERR' | 'FAIL';

@Component({
  selector: 'app-reporte-whatsapp-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './reporte-whatsapp-list-page.component.html',
  styleUrl: './reporte-whatsapp-list-page.component.css',
})
export class ReporteWhatsappListPageComponent implements OnDestroy {
  private readonly temaServicio = inject(ServicioTema);

  iconoWhatsapp = faWhatsapp;

  cargando = signal(false);
  error = signal<string | null>(null);

  busqueda = signal('');
  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');
  estado = signal<EstadoFiltro>('');

  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);

  tema = this.temaServicio.tema;

  filtrosAbiertos = signal(false);

  readonly hoy = this.obtenerFechaHoy();
  readonly rangoMaximoDias = 10;

  estadosDisponibles: { valor: EstadoFiltro; texto: string }[] = [
    { valor: '', texto: 'Todos' },
    { valor: 'Enviado', texto: 'Enviado' },
    { valor: 'ERR_BAD_REQUEST', texto: 'ERR_BAD_REQUEST' },
    { valor: 'ERR', texto: 'ERR (cualquier error)' },
    { valor: 'FAIL', texto: 'FAIL (cualquier fallo)' },
  ];

  private cambiosBusqueda$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private readonly api: ReportesWhatsappApiService,
    private readonly router: Router,
  ) {
    this.subs.add(
      this.cambiosBusqueda$
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((valor) => {
          this.busqueda.set(valor);
          this.aplicarFiltros();
        }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  alternarTema() {
    this.temaServicio.alternar();
  }

  alternarFiltros() {
    this.filtrosAbiertos.set(!this.filtrosAbiertos());
  }

  onCambioBusqueda(valor: string) {
    this.cambiosBusqueda$.next(valor);
  }

  onCambioFechaDesde(valor: string) {
    const fechaNormalizada = this.normalizarFechaPermitida(valor);
    this.fechaDesde.set(fechaNormalizada);

    const hasta = this.fechaHasta();
    if (!fechaNormalizada) {
      if (hasta) {
        this.fechaHasta.set(this.normalizarFechaPermitida(hasta));
      }
      return;
    }

    if (!hasta) {
      return;
    }

    const hastaNormalizada = this.normalizarFechaPermitida(hasta);
    const maxHasta = this.sumarDias(fechaNormalizada, this.rangoMaximoDias);
    const maxHastaPermitida = this.menorFecha(maxHasta, this.hoy);

    if (hastaNormalizada < fechaNormalizada) {
      this.fechaHasta.set(fechaNormalizada);
      return;
    }

    if (hastaNormalizada > maxHastaPermitida) {
      this.fechaHasta.set(maxHastaPermitida);
    }
  }

  onCambioFechaHasta(valor: string) {
    const fechaNormalizada = this.normalizarFechaPermitida(valor);
    this.fechaHasta.set(fechaNormalizada);

    const desde = this.fechaDesde();
    if (!fechaNormalizada) {
      if (desde) {
        this.fechaDesde.set(this.normalizarFechaPermitida(desde));
      }
      return;
    }

    if (!desde) {
      return;
    }

    const desdeNormalizada = this.normalizarFechaPermitida(desde);
    const minDesde = this.restarDias(fechaNormalizada, this.rangoMaximoDias);

    if (desdeNormalizada > fechaNormalizada) {
      this.fechaDesde.set(fechaNormalizada);
      return;
    }

    if (desdeNormalizada < minDesde) {
      this.fechaDesde.set(minDesde);
    }
  }

  obtenerMinFechaHasta(): string {
    const desde = this.fechaDesde();
    if (!desde) {
      return '';
    }
    return desde;
  }

  obtenerMaxFechaHasta(): string {
    const desde = this.fechaDesde();
    if (!desde) {
      return this.hoy;
    }
    const maxHasta = this.sumarDias(desde, this.rangoMaximoDias);
    return this.menorFecha(maxHasta, this.hoy);
  }

  obtenerMinFechaDesde(): string {
    const hasta = this.fechaHasta();
    if (!hasta) {
      return '';
    }
    return this.restarDias(hasta, this.rangoMaximoDias);
  }

  obtenerMaxFechaDesde(): string {
    const hasta = this.fechaHasta();
    if (!hasta) {
      return this.hoy;
    }
    return this.menorFecha(hasta, this.hoy);
  }

  tieneFiltrosAplicados(): boolean {
    return (
      this.busqueda().trim().length > 0 ||
      this.fechaDesde().trim().length > 0 ||
      this.fechaHasta().trim().length > 0 ||
      this.estado().trim().length > 0
    );
  }

  aplicarFiltros() {
    if (!this.tieneFiltrosAplicados()) {
      this.error.set(null);
      this.conversaciones.set([]);
      this.conversacionSeleccionada.set(null);
      return;
    }

    this.cargarConversaciones();
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.estado.set('');
    this.error.set(null);
    this.conversaciones.set([]);
    this.conversacionSeleccionada.set(null);
  }

  abrirChat(numero: string) {
    this.router.navigate(['/', 'chat', numero]);
  }

  cargarConversaciones() {
    if (!this.tieneFiltrosAplicados()) {
      this.cargando.set(false);
      this.error.set(null);
      this.conversaciones.set([]);
      this.conversacionSeleccionada.set(null);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const filtros: Record<string, string | number> = {
      pagina: 1,
      limite: 50,
      ordenar_por: 'RPW_FECHA',
      orden: 'DESC',
    };

    const texto = this.busqueda().trim();
    if (texto.length > 0) {
      filtros['busqueda'] = texto;
    }

    const fd = this.fechaDesde().trim();
    const fh = this.fechaHasta().trim();

    if (fd.length > 0) {
      filtros['fecha_desde'] = fd;
    }

    if (fh.length > 0) {
      filtros['fecha_hasta'] = fh;
    }

    const est = this.estado();
    if (est && est.length > 0 && est !== 'ERR' && est !== 'FAIL') {
      filtros['estado'] = est;
    }

    this.api.consultar(filtros).subscribe({
      next: (r) => {
        let datos = r?.datos ?? [];

        if (est === 'ERR') {
          datos = datos.filter((x) =>
            (x.rpw_estado ?? '').toUpperCase().includes('ERR'),
          );
        }

        if (est === 'FAIL') {
          datos = datos.filter((x) =>
            (x.rpw_estado ?? '').toUpperCase().includes('FAIL'),
          );
        }

        const convers = this.construirConversaciones(datos);
        this.conversaciones.set(convers);
        this.conversacionSeleccionada.set(convers[0] ?? null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(
          e?.error?.message ?? e?.message ?? 'No se pudo cargar el listado',
        );
        this.cargando.set(false);
      },
    });
  }

  private construirConversaciones(datos: ReportePlantillaWhatsapp[]): Conversacion[] {
    const mapa = new Map<string, Conversacion>();

    for (const item of datos) {
      const numero = item.rpw_numero;
      const actual = mapa.get(numero);

      const texto =
        item.rpw_mensaje && item.rpw_mensaje.trim().length > 0
          ? item.rpw_mensaje
          : item.rpw_variable_json && item.rpw_variable_json.trim().length > 0
            ? item.rpw_variable_json
            : '';

      const registro: Conversacion = {
        numero,
        nombre: item.rpw_nombre,
        ultimoMensaje: texto,
        ultimaFecha: item.rpw_fecha,
        ultimaHora: item.rpw_hora,
        estado: item.rpw_estado,
        plantilla: item.rpw_nombre_plantilla,
      };

      if (!actual) {
        mapa.set(numero, registro);
        continue;
      }

      const tsActual = `${actual.ultimaFecha} ${actual.ultimaHora}`;
      const tsNuevo = `${registro.ultimaFecha} ${registro.ultimaHora}`;

      if (tsNuevo > tsActual) {
        mapa.set(numero, registro);
      }
    }

    return Array.from(mapa.values()).sort((a, b) => {
      const ta = `${a.ultimaFecha} ${a.ultimaHora}`;
      const tb = `${b.ultimaFecha} ${b.ultimaHora}`;
      return tb.localeCompare(ta);
    });
  }

  private obtenerFechaHoy(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private normalizarFechaPermitida(valor: string): string {
    const fecha = (valor ?? '').trim();
    if (!fecha) {
      return '';
    }
    if (fecha > this.hoy) {
      return this.hoy;
    }
    return fecha;
  }

  private sumarDias(fecha: string, dias: number): string {
    const base = new Date(`${fecha}T00:00:00`);
    base.setDate(base.getDate() + dias);
    const anio = base.getFullYear();
    const mes = String(base.getMonth() + 1).padStart(2, '0');
    const dia = String(base.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private restarDias(fecha: string, dias: number): string {
    const base = new Date(`${fecha}T00:00:00`);
    base.setDate(base.getDate() - dias);
    const anio = base.getFullYear();
    const mes = String(base.getMonth() + 1).padStart(2, '0');
    const dia = String(base.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private menorFecha(a: string, b: string): string {
    return a <= b ? a : b;
  }

  seleccionar(c: Conversacion) {
    this.conversacionSeleccionada.set(c);
  }

  formatearFecha(fecha: string) {
    return fecha?.slice(0, 10) ?? '';
  }

  recortar(texto: string, max = 44) {
    const t = (texto ?? '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) {
      return t;
    }
    return t.slice(0, max) + '…';
  }

  obtenerIniciales(nombre: string) {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
    const a = partes[0]?.[0] ?? '';
    const b =
      partes.length > 1 ? (partes[1]?.[0] ?? '') : (partes[0]?.[1] ?? '');
    return (a + b).toUpperCase();
  }
}
