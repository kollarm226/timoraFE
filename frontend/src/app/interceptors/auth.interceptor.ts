import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { auth } from '../config/firebase.config';

// Cache pre Firebase token
let cachedToken: string | null = null;
let tokenExpiration = 0;

/**
 * HTTP Interceptor pre pridanie Firebase ID tokenu do kazdeho requestu
 * Automaticky pridava Authorization header s Firebase token
 * Token sa cachuje a refreshuje len ked je potrebne (pred expiraciou)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Interceptor je potrebny pre vsetky requesty kde je uzivatel prihlaseny
  // Obzvlast pre /auth/register kde backend potrebuje Firebase token
  
  const currentUser = auth.currentUser;

  // Ak nie je prihlaseny uzivatel, pokracuj bez tokenu
  if (!currentUser) {
    cachedToken = null;
    return next(req);
  }

  const now = Date.now();
  
  // Ak mame platny cached token (expirace minus 5 min buffer), pouzij ho
  if (cachedToken && tokenExpiration > now + 5 * 60 * 1000) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${cachedToken}`
      }
    });
    return next(clonedRequest);
  }

  // Token neexistuje alebo expiroval, ziskaj novy
  return from(
    currentUser.getIdToken(false) // false = pouzije Firebase cache, refreshne len ak je potrebne
      .catch(error => {
        console.error('Error getting Firebase token:', error);
        return null;
      })
  ).pipe(
    switchMap(token => {
      if (!token) {
        console.warn('No Firebase token available, sending request without authentication');
        return next(req);
      }
      
      // Uloz token do cache (tokeny exspiruju po 1 hodine)
      cachedToken = token;
      tokenExpiration = now + 60 * 60 * 1000; // 1 hodina
      
      // Klonuj request a pridaj Authorization header
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedRequest);
    })
  );
};
