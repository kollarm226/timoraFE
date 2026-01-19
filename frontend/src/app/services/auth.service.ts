import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject, Subscription } from 'rxjs';
import { map, catchError, switchMap, filter, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { ApiUser } from '../models/api.models';
import { environment } from '../../environments/environment';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebase.config';

// Typ pre flexibilnu API odpoved, ktora moze mat rozne nazvy poli
interface FlexibleUserResponse {
  [key: string]: unknown;
  // Bezne variacie pre polia uzivatela
  UserId?: string | number;
  userId?: string | number;
  id?: string | number;
  ID?: string | number;
  FirstName?: string;
  firstName?: string;
  first_name?: string;
  LastName?: string;
  lastName?: string;
  last_name?: string;
  Email?: string;
  email?: string;
  CompanyId?: string | number;
  companyId?: string | number;
  Role?: string | number;
  role?: string | number;
}

/**
 * Auth service - autentifikacia a autorizacia
 * Pouziva Firebase Authentication
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl || 'https://timorabe.azurewebsites.net/api';
  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();
  private currentUserSubscription: Subscription | null = null; // Sledovanie aktivneho odberu

  constructor() {
    // Monitorovanie zmien stavu autentifikacie
    onAuthStateChanged(auth, (firebaseUser) => {
      console.log('onAuthStateChanged spustene, firebaseUser:', firebaseUser?.email || 'null');

      // Ak existuje stary odber, zrus ho - aby sa nenacitavali stare udaje
      if (this.currentUserSubscription) {
        console.log('Rusim odber predchadzajuceho pouzivatela...');
        this.currentUserSubscription.unsubscribe();
        this.currentUserSubscription = null;
      }

      if (firebaseUser && firebaseUser.email) {
        // KRITICKE: Najskor vycisti currentUser aby sa predislo race condition so starymi datami
        console.log('Cistim stare udaje pouzivatela pred nacitanim noveho...');
        this.currentUser.next(null);

        // Uzivatel je prihlaseny - nacitaj jeho data z backendu cez /api/auth/me endpoint
        console.log('Uzivatel prihlaseny:', firebaseUser.email, '- stahujem data z backendu...');

        const expectedEmail = firebaseUser.email; // Uloz email na validaciu

        const userSubscription = from(firebaseUser.getIdToken(true)).pipe( // true = vynut obnovenie tokenu
          switchMap((token: string) => {
            console.log('Ziskany Firebase token, volam /api/auth/me...');
            return this.http.get<ApiUser>(`${this.baseUrl}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
          })
        ).subscribe({
          next: (apiUser) => {
            console.log('=== UZIVATEL NACITANY Z BACKENDU ===');
            console.log('Plna odpoved:', JSON.stringify(apiUser, null, 2));
            console.log('Kluce odpovede:', Object.keys(apiUser));

            // Skusaj vsetky mozne nazvy poli
            console.log('--- Mozne identifikatory ---');
            console.log('UserId:', (apiUser as FlexibleUserResponse).UserId);
            console.log('userId:', (apiUser as FlexibleUserResponse).userId);
            console.log('id:', (apiUser as FlexibleUserResponse).id);
            console.log('ID:', (apiUser as FlexibleUserResponse).ID);

            console.log('--- Mozne polia mien ---');
            console.log('FirstName:', (apiUser as FlexibleUserResponse).FirstName);
            console.log('firstName:', (apiUser as FlexibleUserResponse).firstName);
            console.log('first_name:', (apiUser as FlexibleUserResponse).first_name);
            console.log('LastName:', (apiUser as FlexibleUserResponse).LastName);
            console.log('lastName:', (apiUser as FlexibleUserResponse).lastName);
            console.log('last_name:', (apiUser as FlexibleUserResponse).last_name);

            console.log('--- Email ---');
            console.log('Email:', (apiUser as FlexibleUserResponse).Email);
            console.log('email:', (apiUser as FlexibleUserResponse).email);

            // Validuj ze nacitany uzivatel je ten spravny
            const responseEmail = (apiUser as FlexibleUserResponse).Email || (apiUser as FlexibleUserResponse).email;
            if (responseEmail !== expectedEmail) {
              console.error('🔴 Nezhoda emailov! Cakany:', expectedEmail, 'Dostany:', responseEmail);
              console.error('Bezpecnostny problem: Backend vratil nespravne udaje uzivatela!');
              throw new Error(`Nezhoda emailov: cakany ${expectedEmail}, dostany ${responseEmail}`);
            }

            const user: User = {
              id: (() => {
                const idValue = (apiUser as FlexibleUserResponse).UserId || (apiUser as FlexibleUserResponse).userId || (apiUser as FlexibleUserResponse).id;
                return idValue ? Number(idValue) : undefined;
              })(),
              companyId: (() => {
                const companyValue = (apiUser as FlexibleUserResponse).CompanyId || (apiUser as FlexibleUserResponse).companyId;
                return companyValue || '';
              })(),
              firstName: String((apiUser as FlexibleUserResponse).FirstName || (apiUser as FlexibleUserResponse).firstName || (apiUser as FlexibleUserResponse).first_name || ''),
              lastName: String((apiUser as FlexibleUserResponse).LastName || (apiUser as FlexibleUserResponse).lastName || (apiUser as FlexibleUserResponse).last_name || ''),
              email: responseEmail as string,
              address: '',
              password: '',
              role: this.mapRoleStringToNumber((apiUser as FlexibleUserResponse).Role || (apiUser as FlexibleUserResponse).role)
            };
            console.log('Mapped user object:', JSON.stringify(user, null, 2));
            console.log('Setting currentUser to:', user);
            this.currentUser.next(user);
          },
          error: (err) => {
            console.error('Failed to fetch user from backend /api/auth/me:', err);
            // Fallback na Firebase displayName ak backend zlyha
            const user: User = {
              companyId: firebaseUser.displayName?.split('|')[0] || '',
              firstName: firebaseUser.displayName?.split('|')[1]?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split('|')[1]?.split(' ')[1] || '',
              email: firebaseUser.email || '',
              address: firebaseUser.displayName?.split('|')[2] || '',
              password: '',
              role: 0 // Default Employee
            };
            console.log('Using fallback user:', user);
            this.currentUser.next(user);
          }
        });

        // Ulož subscription aby si ju mohol neskôr zrušiť
        this.currentUserSubscription = userSubscription;
      } else {
        // User nie je prihlaseny - vyčisti stav
        console.log('User logged out - clearing currentUser');
        this.currentUser.next(null);
      }
    });
  }

  /**
   * Registracia noveho uzivatela cez Firebase + backend
   * 1. Vycisti cache aby sa nenacitali stare data
   * 2. Vytvori uzivatela v Firebase
   * 3. Ziska Firebase token
   * 4. Odosle POST /api/auth/register na backend (s companyId alebo companyName)
   * 5. Ak backend zlyha, odstrani uzivatela z Firebase (rollback)
   */
  register(user: User | Record<string, unknown>): Observable<{ success: boolean; user: FlexibleUserResponse }> {
    // KRITICKE: Vycisti vsetky cache PRED registraciou a POCKAJ na dokoncenie
    console.log('Cistim vsetku cache pred registraciou...');

    return from(this.clearAllCache()).pipe(
      switchMap(() => {
        console.log('Cache vycistena, pokracujem s Firebase registraciou...');
        const userEmail = (user as User).email || String((user as Record<string, unknown>)['email'] || '');
        const userPassword = (user as User).password || String((user as Record<string, unknown>)['password'] || '');
        return from(createUserWithEmailAndPassword(auth, userEmail, userPassword));
      }),
      switchMap((userCredential: UserCredential) => {
        // Store the Firebase credential for potential rollback
        const firebaseUser = userCredential.user;
        // Set displayName so it's preserved in Firebase for later use
        const displayName = `${(user as User).companyId || (user as Record<string, unknown>)['companyId'] || 'default'}|${(user as User).firstName || (user as Record<string, unknown>)['firstName']} ${(user as User).lastName || (user as Record<string, unknown>)['lastName']}`;
        return from(updateProfile(firebaseUser, { displayName })).pipe(
          switchMap(() => from(userCredential.user.getIdToken())),
          switchMap((token: string) => {
            // Prepare request body depending on companyId or companyName
            const body: Record<string, unknown> = {
              firstName: (user as User).firstName || (user as Record<string, unknown>)['firstName'],
              lastName: (user as User).lastName || (user as Record<string, unknown>)['lastName'],
              userName: (user as User).userName || String((user as User).email || (user as Record<string, unknown>)['email']).split('@')[0],
              email: (user as User).email || (user as Record<string, unknown>)['email']  // ← REQUIRED by backend!
            };

            if ((user as User).companyId !== undefined && (user as User).companyId !== null) {
              body['companyId'] = (user as User).companyId;
              console.log('Register: Joining existing company with ID:', (user as User).companyId);
            } else if ((user as User).companyName || (user as Record<string, unknown>)['companyName']) {
              body['companyName'] = (user as User).companyName || (user as Record<string, unknown>)['companyName'];
              console.log('Register: Creating new company with name:', (user as User).companyName || (user as Record<string, unknown>)['companyName']);
            }

            console.log('Register request body:', body);

            // Volaj backend /api/auth/register s Firebase tokenом
            return this.http.post<{ success: boolean; user: FlexibleUserResponse }>(
              `${this.baseUrl}/auth/register`,
              body,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            ).pipe(
              catchError(backendError => {
                console.error('Backend registration failed:', backendError);

                // If user already exists (409), update their firstName/lastName and continue
                if (backendError.status === 409) {
                  console.log('User already exists, updating firstName and lastName');
                  return from(userCredential.user.getIdToken()).pipe(
                    switchMap((token: string) => {
                      // Get user by email first to get their ID
                      return this.http.get<FlexibleUserResponse>(`${this.baseUrl}/Users/by-email/${encodeURIComponent(userCredential.user.email!)}`, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      }).pipe(
                        switchMap((existingUser) => {
                          // Update user with new firstName/lastName
                          return this.http.patch<ApiUser>(
                            `${this.baseUrl}/Users/${existingUser.id}`,
                            {
                              firstName: user.firstName,
                              lastName: user.lastName
                            },
                            {
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            }
                          ).pipe(
                            map((updatedUser) => ({
                              success: true,
                              user: updatedUser
                            }))
                          );
                        })
                      );
                    })
                  );
                }

                // For other errors, rollback Firebase user
                return from(deleteUser(firebaseUser)).pipe(
                  switchMap(() => throwError(() => backendError)),
                  catchError(() => throwError(() => backendError)) // Even if delete fails, throw backend error
                );
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email address is already in use';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid registration data';
        } else if (error.status === 409) {
          errorMessage = 'User already exists in backend';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Prihlasenie uzivatela cez Firebase
   * 1. Vycisti cache aby sa nenacitali stare data
   * 2. Prihlasi cez Firebase (email + heslo)
   * 3. onAuthStateChanged callback automaticky nacita user data z /api/auth/me
   * 4. Caka kym sa uzivatel nacita a potom vrati uspech
   */
  login(credentials: { username: string; password: string }): Observable<{ success: boolean; user: User }> {
    // username je email v login formu
    const expectedEmail = credentials.username.toLowerCase().trim();

    return from(
      signInWithEmailAndPassword(auth, credentials.username, credentials.password)
    ).pipe(
      switchMap(() => {
        console.log('Firebase prihlasenie uspesne, cakam na data uzivatela...');

        // Po Firebase prihlaseni cakaj na onAuthStateChanged callback
        // ktory automaticky nacita user data cez /api/auth/me
        // KRITICKE: Musime cakat na SPRAVNEHO uzivatela (porovnaj email)
        return this.currentUser$.pipe(
          filter(user => {
            if (user === null) return false;
            const isCorrectUser = user.email?.toLowerCase() === expectedEmail;
            console.log('currentUser$ emitted:', user.email, '| Expected:', expectedEmail, '| Match:', isCorrectUser);
            return isCorrectUser;
          }),
          take(1), // Vezmeme iba prvý emit so správnym userom
          map(user => ({
            success: true,
            user: user!
          }))
        );
      }),
      catchError(error => {
        let errorMessage = 'Login failed';

        // Firebase chyby
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'User not found';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Odhlasenie uzivatela
   * Vycisti Firebase relaciu, resetuje currentUser a vymaze VSETKU cache
   * - localStorage, sessionStorage
   * - Firebase IndexedDB
   * - Service Worker cache
   */
  logout(): Observable<void> {
    // Najjednoduchsi logout - iba Firebase signOut
    this.currentUser.next(null);
    console.log('Uzivatel odhlaseny a currentUser vycisteny');

    // Vyčisti subscription
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
      this.currentUserSubscription = null;
    }

    return from(signOut(auth));
  }

  /**
   * Vycisti localStorage, sessionStorage a selektivne Firebase cache
   * Vracia Promise aby sa dalo cakat na dokoncenie
   */
  private clearAllCache(): Promise<void> {
    return new Promise((resolve) => {
      // 1. Zachovaj nastavenie temy pred vycistenim
      let savedTheme: string | null = null;
      try {
        savedTheme = localStorage.getItem('theme');
      } catch (e) {
        console.warn('Nepodarilo sa precitat temu:', e);
      }

      // 2. Vycisti Web Storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Vycistene localStorage a sessionStorage');
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }

      // 3. Restore theme setting immediately after clearing
      if (savedTheme) {
        try {
          localStorage.setItem('theme', savedTheme);
          console.log('Restored theme setting:', savedTheme);
        } catch (e) {
          console.warn('Could not restore theme:', e);
        }
      }

      // 4. Vyčisti iba kritické Firebase IndexedDB (nie všetky)
      const dbPromise = this.clearCriticalFirebaseDB();

      // 5. Vyčisti Service Worker cache
      let cachePromise = Promise.resolve();
      if ('caches' in window) {
        cachePromise = caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName =>
              caches.delete(cacheName).then(() => {
                console.log(`Cleared cache: ${cacheName}`);
              })
            )
          );
        }).then(() => { /* Cache cleared */ }).catch(e => {
          console.warn('Error clearing service worker cache:', e);
        });
      }

      // Počkaj na všetky async operácie + malý delay pre istotu
      Promise.all([dbPromise, cachePromise]).then(() => {
        // Malý delay pre istotu, že IndexedDB operácie sa dokončili
        setTimeout(() => {
          console.log('All cache cleared successfully (with delay)');
          resolve();
        }, 300); // Kratší delay
      }).catch(() => {
        console.warn('Some cache clearing failed, but continuing...');
        // Kratší delay aj pri chybe
        setTimeout(() => resolve(), 150);
      });
    });
  }

  /**
   * Vycisti iba kriticke Firebase IndexedDB databazy
   * Menej agresivne ako clearFirebaseIndexedDB - nevymaze vsetky DB
   */
  private clearCriticalFirebaseDB(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Iba kriticke databazy ktore mozu obsahovat staru relaciu
        const criticalDBs = [
          'firebaseLocalStorageDb'      // <- KRITICKE! Tu Firebase Auth uklada relaciu
        ];

        const deletePromises = criticalDBs.map((dbName) => {
          return new Promise<void>((resolveDb) => {
            if (indexedDB && indexedDB.deleteDatabase) {
              try {
                const request = indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => {
                  console.log(`Vycistena kriticka Firebase IndexedDB: ${dbName}`);
                  resolveDb();
                };
                request.onerror = () => {
                  console.warn(`Nepodarilo sa vycistit ${dbName}`);
                  resolveDb();
                };
                request.onblocked = () => {
                  console.warn(`Databaza ${dbName} je blokovana, vynucujem uzavretie...`);
                  resolveDb();
                };
              } catch (e) {
                console.warn(`Nepodarilo sa vycistit ${dbName}:`, e);
                resolveDb();
              }
            } else {
              resolveDb();
            }
          });
        });

        Promise.all(deletePromises).then(() => {
          console.log('Kriticke Firebase IndexedDB vycistene');
          resolve();
        });
      } catch (e) {
        console.warn('Chyba pri cisteni kritickych Firebase IndexedDB:', e);
        resolve();
      }
    });
  }

  /**
   * Vycisti Firebase IndexedDB databazy
   * Potrebne aby sa stary cached user data nenacital pri dalsom login-e
   * KRITICKE: Zahrna firebaseLocalStorageDb kde Firebase Auth uklada relaciu!
   */
  private clearFirebaseIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const firebaseDBs = [
          'firebaseLocalStorageDb',      // ← KRITICKÉ! Tu Firebase Auth ukladá session
          'firebase-heartbeat-store',
          'firebase-installations-store',
          'firebase-app-check-store',
          'firebase-auth-instance'
        ];

        const deletePromises = firebaseDBs.map((dbName) => {
          return new Promise<void>((resolveDb) => {
            if (indexedDB && indexedDB.deleteDatabase) {
              try {
                const request = indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => {
                  console.log(`Cleared Firebase IndexedDB: ${dbName}`);
                  resolveDb();
                };
                request.onerror = () => {
                  console.warn(`Could not clear ${dbName}`);
                  resolveDb();
                };
                request.onblocked = () => {
                  console.warn(`Database ${dbName} is blocked, forcing close...`);
                  resolveDb();
                };
              } catch (e) {
                console.warn(`Could not clear ${dbName}:`, e);
                resolveDb();
              }
            } else {
              resolveDb();
            }
          });
        });

        Promise.all(deletePromises).then(() => {
          console.log('All Firebase IndexedDB cleared');
          resolve();
        });
      } catch (e) {
        console.warn('Error clearing Firebase IndexedDB:', e);
        resolve();
      }
    });
  }

  /**
   * Reset hesla cez Firebase - odosle odkaz na obnovenie na email
   */
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(auth, email)).pipe(
      catchError(error => {
        let message = 'Obnovenie hesla zlyhalo';
        if (error.code === 'auth/user-not-found') {
          message = 'Uzivatel nenajdeny';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Neplatny email';
        }
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Ziska aktualneho uzivatela
   */
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  /**
   * Skontroluje ci je uzivatel overeny
   */
  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }

  /**
   * Mapuje textovu rolu z backendu na ciselne hodnoty
   * Backend vracia: "Employee", "Employer", "Admin"
   * Frontend ocakava: 0=Employee, 1=Employer, 2=Admin
   */
  private mapRoleStringToNumber(roleString: string | number | undefined): number {
    // Ak je to uz cislo, vrat ho
    if (typeof roleString === 'number') {
      return roleString;
    }

    // Ak je to retazec, mapuj na cislo
    if (typeof roleString === 'string') {
      switch (roleString.toLowerCase()) {
        case 'employee':
          return 0;
        case 'employer':
          return 1;
        case 'admin':
          return 2;
        default:
          console.warn(`Neznama rola: ${roleString}, nastavujem predvolenu Employee`);
          return 0;
      }
    }

    // Predvolene Employee
    return 0;
  }

  /**
   * Dodatocne cistenie uloziska pre istotu - iba problematicke kluce
   * Nevymazava vsetky Firebase kluce aby nenarusilo nove prihlasenia
   */
  private forceExtraStorageClearing(): void {
    try {
      // Iba specificke kluce ktore mozu sposobovat problemy s logout/login
      const problematicKeys = [
        'CachedUserToken',
        'UserToken',
        'firebase:authUser',
        'firebase:auth:user',
        'firebase:auth:session'
      ];

      // Vymaz iba problematicke kluce
      problematicKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          console.log(`Odstraneny problematicky kluc: ${key}`);
        } catch (e) {
          console.warn(`Nepodarilo sa odstranit ${key}:`, e);
        }
      });

      console.log('✅ Selektivne cistenie uloziska dokoncene');
    } catch (e) {
      console.warn('⚠️ Selektivne cistenie uloziska zlyhalo:', e);
    }
  }
}
