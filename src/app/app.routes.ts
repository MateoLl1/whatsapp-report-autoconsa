import { Routes } from '@angular/router'
import { REPORTE_ROUTES } from './reporte/reporte.routes'

export const routes: Routes = [
  { path: '', children: REPORTE_ROUTES },
  { path: '**', redirectTo: '' }
]
