import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';

/**
 * Auth servis - autentifikacia a autorizacia uzivatelov
 * Pouziva localStorage na simulovanie backendu (POZOR: len pre development!)
 * V produkcii treba nahradit API callmi
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  /**
   * Nacita zoznam uzivatelov z localStorage
   */
  private getUsers(): User[] {
    const raw = localStorage.getItem('users');
    return raw ? JSON.parse(raw) as User[] : [];
  }

  /**
   * Ulozi zoznam uzivatelov do localStorage
   */
  private saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  /**
   * Registracia noveho uzivatela
   * Kontroluje duplicitu companyId a emailu
   */
  register(user: User): Observable<{ success: boolean; user: User }> {
    const users = this.getUsers();

    // Kontrola duplicity companyId
    if (users.find(u => u.companyId?.toLowerCase() === user.companyId.toLowerCase())) {
      return throwError(() => new Error('Company ID uz existuje'));
    }

    // Kontrola duplicity emailu
    if (users.find(u => u.email?.toLowerCase() === user.email.toLowerCase())) {
      return throwError(() => new Error('E-mailova adresa je uz pouzita'));
    }

    users.push(user);
    this.saveUsers(users);

    return of({ success: true, user }).pipe(delay(500));
  }

  /**
   * Prihlasenie uzivatela
   * Kontroluje companyId, username (firstName/lastName) a heslo
   */
  login(credentials: { companyId: string; username: string; password: string }): Observable<{ success: boolean; user: User }> {
    const users = this.getUsers();
    
    // Najdi uzivatela podla companyId a username (firstName alebo lastName)
    const user = users.find(u => 
      u.companyId?.toLowerCase() === credentials.companyId.toLowerCase() &&
      (u.firstName?.toLowerCase() === credentials.username.toLowerCase() || 
       u.lastName?.toLowerCase() === credentials.username.toLowerCase() ||
       `${u.firstName} ${u.lastName}`.toLowerCase() === credentials.username.toLowerCase())
    );

    if (!user) {
      return throwError(() => new Error('Invalid credentials'));
    }

    if (user.password !== credentials.password) {
      return throwError(() => new Error('Invalid password'));
    }

    return of({ success: true, user }).pipe(delay(500));
  }
}
