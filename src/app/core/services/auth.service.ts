import { Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, map, tap, shareReplay } from 'rxjs'
import { environment } from '../../../environments/environment'
import { RespuestaTokenAuth } from '../interfaces/token-auth.interface'


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly url = `${environment.apiBaseUrl}/auth/token`

  token = signal<string | null>(null)
  expiraEnMs = signal<number>(0)

  private solicitudEnCurso$: Observable<string> | null = null

  constructor(private readonly http: HttpClient) {}

  obtenerTokenValido(): Observable<string> {
    const tokenActual = this.token()
    const expira = this.expiraEnMs()

    const ahora = Date.now()
    const margenRenovacion = 30_000

    if (tokenActual && expira > ahora + margenRenovacion) {
      return new Observable<string>((sub) => {
        sub.next(tokenActual)
        sub.complete()
      })
    }

    if (this.solicitudEnCurso$) return this.solicitudEnCurso$

    this.solicitudEnCurso$ = this.http.post<RespuestaTokenAuth>(this.url, {}).pipe(
      map((r) => r.access_token),
      tap((t) => {
        const ahora2 = Date.now()
        const ttlMs = 300_000
        this.token.set(t)
        this.expiraEnMs.set(ahora2 + ttlMs)
      }),
      tap(() => {
        this.solicitudEnCurso$ = null
      }),
      shareReplay(1)
    )

    return this.solicitudEnCurso$
  }

  limpiar() {
    this.token.set(null)
    this.expiraEnMs.set(0)
    this.solicitudEnCurso$ = null
  }
}
