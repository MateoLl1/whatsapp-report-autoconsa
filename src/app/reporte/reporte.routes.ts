import { Routes } from '@angular/router'
import { ReporteWhatsappPlaceholderComponent } from './layouts/placeholder/reporte-whatsapp-placeholder.component'
import { ReporteWhatsappChatPageComponent } from './pages/chat/reporte-whatsapp-chat-page/reporte-whatsapp-chat-page.component'


export const REPORTE_ROUTES: Routes = [
  { path: '', component: ReporteWhatsappPlaceholderComponent },
  { path: 'chat/:numero', component: ReporteWhatsappChatPageComponent }
]