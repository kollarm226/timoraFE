import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';

/**
 * Hlavna konfiguracia aplikacie
 * Poskytuje vsetky providery potrebne pre Angular standalone komponenty
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),                  // Moderny Fetch API namiesto XMLHttpRequest
      withInterceptorsFromDi()      // Podpora pre DI interceptors
    ),
    provideClientHydration(withEventReplay())  // SSR support s event replay
  ]
};
