import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { HTTP_INTERCEPTORS } from '@angular/common/http'
import { routes } from './app.routes'
import { API_BASE_URL } from './core/http/api-base-url.token'
import { ApiInterceptor } from './core/http/api.interceptor'
import { environment } from '../environments/environment.development'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
  ]
}
