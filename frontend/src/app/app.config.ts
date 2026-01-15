import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

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
      withInterceptors([authInterceptor])  // Pridanie Firebase auth interceptoru
    ),
    provideClientHydration(withEventReplay()),  // SSR support s event replay
  ]
};
