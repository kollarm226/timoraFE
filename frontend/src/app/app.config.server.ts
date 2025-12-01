import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Server-side rendering (SSR) konfiguracia
 * Merguje client config s SSR-specifickymi providermi
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    provideHttpClient(withFetch())  // HttpClient pre SSR
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
