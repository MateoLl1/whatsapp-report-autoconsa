import { Routes } from '@angular/router'

import { REPORTE_ROUTES } from './reporte/reporte.routes'
import { ReporteWhatsappLayoutComponent } from './reporte/layouts/reporte-whatsapp-layout/reporte-whatsapp-layout.component'

export const routes: Routes = [
  {
    path: '',
    component: ReporteWhatsappLayoutComponent,
    children: REPORTE_ROUTES
  }
]