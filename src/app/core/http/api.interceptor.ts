import { Inject, Injectable } from '@angular/core'
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable, switchMap } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { API_BASE_URL } from './api-base-url.token'


@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly auth: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const esAbsoluta = req.url.startsWith('http://') || req.url.startsWith('https://')

    const urlFinal = esAbsoluta
      ? req.url
      : `${this.apiBaseUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`

    const esDeMiApi = urlFinal.startsWith(this.apiBaseUrl)
    if (!esDeMiApi) {
      return next.handle(req)
    }

    const esEndpointToken = urlFinal.startsWith(`${this.apiBaseUrl}/auth/token`)
    if (esEndpointToken) {
      return next.handle(req.clone({ url: urlFinal }))
    }

    return this.auth.obtenerTokenValido().pipe(
      switchMap((token) => {
        const clonado = req.clone({
          url: urlFinal,
          setHeaders: { Authorization: `Bearer ${token}` }
        })
        return next.handle(clonado)
      })
    )
  }
}
