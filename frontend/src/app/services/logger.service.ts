import { Injectable } from '@angular/core';

/**
 * Centralizovana sluzba logovania
 * Vsetok konzolovy vystup by mal ist cez tuto sluzbu pre jednoduchsie spravovanie
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private isDevelopment = !this.isProduction();

  /**
   * Logovanie vseobecnych informacii (len vo vyvojovom rezime)
   */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  /**
   * Logovanie debug informacii (len vo vyvojovom rezime)
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Logovanie varovani
   */
  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  /**
   * Logovanie chyb
   */
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error || '');
  }

  /**
   * Skontroluje, ci bezi aplikacia v produkcii
   */
  private isProduction(): boolean {
    return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  }
}
