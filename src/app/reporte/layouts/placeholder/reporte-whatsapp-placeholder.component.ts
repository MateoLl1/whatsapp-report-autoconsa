import { Component } from '@angular/core'

@Component({
  selector: 'app-reporte-whatsapp-placeholder',
  standalone: true,
  template: `
    <div class="panel-vacio">
      <div class="icono"></div>
      <h2>Selecciona un chat</h2>
      <p>Elige una conversación en el panel izquierdo para verla.</p>
    </div>
  `,
  styles: [`
    .panel-vacio {
      height: 100%;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 24px;
      color: #8696a0;
    }
    .panel-vacio h2 {
      color: #e9edef;
      margin: 10px 0 6px 0;
      font-size: 20px;
      font-weight: 600;
    }
    .panel-vacio p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
    }
    .icono {
      width: 120px;
      height: 120px;
      border-radius: 999px;
      background: #111b21;
      border: 1px solid #202c33;
      margin: 0 auto 10px auto;
    }
  `]
})
export class ReporteWhatsappPlaceholderComponent {}