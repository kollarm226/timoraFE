import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Auth guard - zabranuje pristupu neautentifikovanym uzivatelom
 * Presmeruje na login ak uzivatel nie je prihlaseny
 * Presmeruje na pending-approval ak uzivatel nie je schvaleny
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (!user || !user.id) {
        // User nie je prihlaseny, presmeruj na login
        router.navigate(['/login']);
        return false;
      }

      //Zamestnavatelia - Employers (role === 1) su auto-approved
      if (user.role !== 1 && user.isApproved === false) {
        // User caka na schvalenie zamestnavatelom
        router.navigate(['/pending-approval']);
        return false;
      }

      // User je prihlaseny a schvaleny (alebo je Employer)
      return true;
    })
  );
};
