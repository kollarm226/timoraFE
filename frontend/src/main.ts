import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { appConfig } from './app/app.config';

// Merge application-level providers from `appConfig` so things like HttpClient
// (provided via provideHttpClient) are available to standalone components.
bootstrapApplication(AppComponent, {
  providers: [
    // include any providers declared in appConfig (provideHttpClient, etc.)
    ...(appConfig.providers ?? []),
    // keep router provider as a fallback
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
