import { Inject, Injectable } from '@angular/core'
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_BASE_URL } from './api-base-url.token'

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(@Inject(API_BASE_URL) private readonly apiBaseUrl: string) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
      return next.handle(req)
    }

    const url = `${this.apiBaseUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`
    return next.handle(req.clone({ url }))
  }
}
