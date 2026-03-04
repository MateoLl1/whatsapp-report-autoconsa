import { APP_INITIALIZER } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ServicioTema } from './app/core/services/tema.service';

function inicializadorTema(servicioTema: ServicioTema) {
  return () => servicioTema.inicializar();
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    {
      provide: APP_INITIALIZER,
      useFactory: inicializadorTema,
      deps: [ServicioTema],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
