import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Auth guard - zabranuje pristupu neautentifikovanym uzivatelom
 * Presmeruje na login ak uzivatel nie je prihlaseny
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (user && user.id) {
        // User je prihlaseny
        return true;
      } else {
        // User nie je prihlaseny, presmeruj na login
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
