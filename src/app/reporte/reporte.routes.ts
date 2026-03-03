import { Routes } from '@angular/router'
import { ReporteWhatsappListPageComponent } from './pages/lista/reporte-whatsapp-list-page/reporte-whatsapp-list-page.component'
import { ReporteWhatsappChatPageComponent } from './pages/chat/reporte-whatsapp-chat-page/reporte-whatsapp-chat-page.component'


export const REPORTE_ROUTES: Routes = [
  { path: '', component: ReporteWhatsappListPageComponent },
  { path: 'chat/:numero', component: ReporteWhatsappChatPageComponent }
]
