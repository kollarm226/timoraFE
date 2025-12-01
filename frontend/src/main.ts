import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { appConfig } from './app/app.config';

/**
 * Entry point aplikacie
 * Merguje providery z appConfig (HttpClient, atd.) so standalone komponentom
 */
bootstrapApplication(AppComponent, {
  providers: [
    // Spread operatorom mergujeme vsetkych providerov z appConfig
    ...(appConfig.providers ?? []),
    // Router provider ako fallback (ak nie je v appConfig)
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
