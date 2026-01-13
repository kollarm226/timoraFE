import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebase.config';

/**
 * Auth servis - autentifikacia a autorizacia uzivatelov
 * Pouziva Firebase Authentication
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl || 'https://timorabe.azurewebsites.net/api';
  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor() {
    // Monitor authentication state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User je prihlaseny
        const user: User = {
          companyId: firebaseUser.displayName?.split('|')[0] || '',
          firstName: firebaseUser.displayName?.split('|')[1]?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split('|')[1]?.split(' ')[1] || '',
          email: firebaseUser.email || '',
          address: firebaseUser.displayName?.split('|')[2] || '',
          password: '' // Nechavame prazdne, nie je potrebne
        };
        this.currentUser.next(user);
      } else {
        // User nie je prihlaseny
        this.currentUser.next(null);
      }
    });
  }

  /**
   * Registracia noveho uzivatela cez Firebase + backend
   * 1. Vytvori usera v Firebase
   * 2. Ziska Firebase token
   * 3. Odosle POST /api/auth/register na backend (s companyId alebo companyName)
   */
  register(user: User | any): Observable<{ success: boolean; user: any }> {
    return from(
      createUserWithEmailAndPassword(auth, user.email, user.password)
    ).pipe(
      switchMap((userCredential: UserCredential) => {
        // Ziskaj Firebase token
        return from(userCredential.user.getIdToken()).pipe(
          switchMap((token: string) => {
            // Pripravi telo requestu - podľa toho či je companyId alebo companyName
            let body: any = {
              firstName: user.firstName,
              lastName: user.lastName,
              userName: user.userName || user.email.split('@')[0]
            };

            if (user.companyId !== undefined && user.companyId !== null) {
              body.companyId = user.companyId;
            } else if (user.companyName) {
              body.companyName = user.companyName;
            }

            // Volaj backend /api/auth/register s Firebase tokenом
            return this.http.post<{ success: boolean; user: any }>(
              `${this.baseUrl}/auth/register`,
              body,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          })
        );
      }),
      catchError(error => {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'E-mailova adresa je uz pouzita';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Heslo je preslabe';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Neplatny email';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid registration data';
        } else if (error.status === 409) {
          errorMessage = 'User already exists';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Prihlasenie uzivatela cez Firebase
   */
  login(credentials: { companyId: string; username: string; password: string }): Observable<{ success: boolean; user: User }> {
    // username je email v login formu
    return from(
      signInWithEmailAndPassword(auth, credentials.username, credentials.password)
    ).pipe(
      map((userCredential: UserCredential) => {
        const user: User = {
          companyId: credentials.companyId,
          firstName: '',
          lastName: '',
          email: userCredential.user.email || '',
          address: '',
          password: ''
        };
        return {
          success: true,
          user
        };
      }),
      catchError(error => {
        let errorMessage = 'Login failed';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Uzivatel nenajdeny';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Zle heslo';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Neplatny email';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Odhlasenie uzivatela
   */
  logout(): Observable<void> {
    return from(signOut(auth));
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }
}
