import { Injectable, signal } from '@angular/core';

export type TemaApp = 'oscuro' | 'claro';

@Injectable({ providedIn: 'root' })
export class ServicioTema {
  tema = signal<TemaApp>('oscuro');

  inicializar() {
    const guardado = (localStorage.getItem('tema_app') as TemaApp | null);
    const tema = guardado === 'claro' || guardado === 'oscuro' ? guardado : 'oscuro';
    this.aplicar(tema);
  }

  alternar() {
    const nuevo = this.tema() === 'oscuro' ? 'claro' : 'oscuro';
    this.aplicar(nuevo);
  }

  aplicar(tema: TemaApp) {
    this.tema.set(tema);
    localStorage.setItem('tema_app', tema);

    const raiz = document.documentElement;
    raiz.setAttribute('data-tema', tema);
  }
}
