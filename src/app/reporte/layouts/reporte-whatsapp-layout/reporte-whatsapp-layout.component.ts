import { Component } from '@angular/core';
import { RouterModule } from "@angular/router";
import { ReporteWhatsappListPageComponent } from "../../pages/lista/reporte-whatsapp-list-page/reporte-whatsapp-list-page.component";

@Component({
  selector: 'app-reporte-whatsapp-layout',
  standalone: true,
  imports: [RouterModule, ReporteWhatsappListPageComponent],
  templateUrl: './reporte-whatsapp-layout.component.html',
  styleUrl: './reporte-whatsapp-layout.component.css'
})
export class ReporteWhatsappLayoutComponent {

}
