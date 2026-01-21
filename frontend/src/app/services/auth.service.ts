import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject, Subscription, of, race } from 'rxjs';
import { map, catchError, switchMap, filter, take, timeout } from 'rxjs/operators';
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

// Typ pre flexibilnu API odpoved s roznymi nazvami poli
interface FlexibleUserResponse {
  [key: string]: unknown;
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
  IsApproved?: boolean;
  isApproved?: boolean;
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
  private authError = new BehaviorSubject<string | null>(null); // Na komunikovanie chyb pre login
  private currentUserSubscription: Subscription | null = null; // Sleduje aktivne predplatne

  constructor() {
    // Sleduj zmeny stavu autentifikacie
    onAuthStateChanged(auth, (firebaseUser) => {
      // Ak existuje stare predplatne, zrus ho aby sa nenacitali stare data
      if (this.currentUserSubscription) {
        this.currentUserSubscription.unsubscribe();
        this.currentUserSubscription = null;
      }

      if (firebaseUser && firebaseUser.email) {
        // KRITICKE: Najprv vycisti currentUser aby sa predislo race condition
        this.currentUser.next(null);

        // Uzivatel je prihlaseny - nacitaj jeho data z backendu
        const expectedEmail = firebaseUser.email;
        const subscription = new Subscription();

        const userSubscription = from(firebaseUser.getIdToken(true)).pipe( // true = refresh tokenu
          switchMap((token: string) => {
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
            // Over, ci email z backendu sedi
            const responseEmail = (apiUser as FlexibleUserResponse).Email || (apiUser as FlexibleUserResponse).email;
            if (responseEmail !== expectedEmail) {
              console.error('Email mismatch in backend response! Expected:', expectedEmail, 'Received:', responseEmail);
              this.currentUser.next(null);
              return;
            }

            const user: User = {
              id: (() => {
                const idValue = (apiUser as FlexibleUserResponse).UserId ||
                                (apiUser as FlexibleUserResponse).userId ||
                                (apiUser as FlexibleUserResponse).id;
                return idValue ? Number(idValue) : undefined;
              })(),
              companyId: (() => {
                const companyValue = (apiUser as FlexibleUserResponse).CompanyId ||
                                     (apiUser as FlexibleUserResponse).companyId;
                return companyValue || '';
              })(),
              firstName: String((apiUser as FlexibleUserResponse).FirstName ||
                                (apiUser as FlexibleUserResponse).firstName ||
                                (apiUser as FlexibleUserResponse).first_name || ''),
              lastName: String((apiUser as FlexibleUserResponse).LastName ||
                               (apiUser as FlexibleUserResponse).lastName ||
                               (apiUser as FlexibleUserResponse).last_name || ''),
              email: responseEmail as string,
              address: '',
              password: '',
              role: this.mapRoleStringToNumber((apiUser as FlexibleUserResponse).Role ||
                                               (apiUser as FlexibleUserResponse).role),
              isApproved: (apiUser as FlexibleUserResponse).IsApproved ??
                          (apiUser as FlexibleUserResponse).isApproved ??
                          false
            };

            // Over, ci stale nacitavame rovnakeho uzivatela
            if (this.currentUserSubscription === subscription) {
              this.currentUser.next(user);
            } else {
              console.warn('User context changed during loading, ignoring outdated data');
            }
          },

          error: (err) => {
            console.error('Failed to load user from backend /auth/me:', err);

            // Spracovanie 404 - uzivatel neexistuje v backend
            if (err.status === 404) {
              const creationTime = firebaseUser.metadata.creationTime;
              const creationDate = creationTime ? new Date(creationTime) : new Date();
              const now = new Date();
              const diffSeconds = (now.getTime() - creationDate.getTime()) / 1000;

              // Ak konto existuje dlhsie ako 30s → zamietnute/odstranene adminom
              if (diffSeconds > 30) {
                console.warn('User not found in backend and account is old → assuming rejected/removed.');

                // Oznac chybu
                this.authError.next('User does not exist.');

                // Pokus o zmazanie Firebase pouzivatela
                deleteUser(firebaseUser)
                  .then(() => {
                    this.currentUser.next(null);
                  })
                  .catch(deleteErr => {
                    console.error('Failed to delete Firebase user:', deleteErr);
                    this.logout().subscribe();
                  });

                return;
              }
            }

            // Fallback pri chybe backendu
            const user: User = {
              id: undefined,
              companyId: firebaseUser.displayName?.split('|')[0] || '',
              firstName: firebaseUser.displayName?.split('|')[1]?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split('|')[1]?.split(' ')[1] || '',
              email: firebaseUser.email || '',
              address: firebaseUser.displayName?.split('|')[2] || '',
              password: '',
              role: 0,
              isApproved: false
            };

            if (this.currentUserSubscription === subscription) {
              this.currentUser.next(user);
            }
          }
        });

        subscription.add(userSubscription);
        this.currentUserSubscription = subscription;
      } else {
        // Uzivatel nie je prihlaseny
        this.currentUser.next(null);
      }
    });
  }
    /**
   * Registracia noveho uzivatela cez Firebase + backend
   * 1. Vycisti cache aby sa nenacitali stare data
   * 2. Vytvori uzivatela vo Firebase
   * 3. Ziska Firebase token
   * 4. Odosle POST /api/auth/register na backend (s companyId alebo companyName)
   * 5. Ak backend zlyha, odstrani uzivatela z Firebase (rollback)
   */
  register(user: User | Record<string, unknown>): Observable<{ success: boolean; user: FlexibleUserResponse }> {
    // KRITICKE: Vycisti vsetku cache PRED registraciou a POCKAJ na dokoncenie
    return from(this.clearAllCache()).pipe(
      switchMap(() => {
        const userEmail = (user as User).email || String((user as Record<string, unknown>)['email'] || '');
        const userPassword = (user as User).password || String((user as Record<string, unknown>)['password'] || '');
        return from(createUserWithEmailAndPassword(auth, userEmail, userPassword));
      }),
      switchMap((userCredential: UserCredential) => {
        // Uloz Firebase credential pre pripadny rollback
        const firebaseUser = userCredential.user;
        // Nastav displayName, aby sa zachoval vo Firebase pre neskorsie pouzitie
        const displayName =
          `${(user as User).companyId || (user as Record<string, unknown>)['companyId'] || 'default'}|` +
          `${(user as User).firstName || (user as Record<string, unknown>)['firstName']} ` +
          `${(user as User).lastName || (user as Record<string, unknown>)['lastName']}`;

        return from(updateProfile(firebaseUser, { displayName })).pipe(
          switchMap(() => from(userCredential.user.getIdToken())),
          switchMap((token: string) => {
            // Priprav telo requestu podla companyId alebo companyName
            const body: Record<string, unknown> = {
              firstName: (user as User).firstName || (user as Record<string, unknown>)['firstName'],
              lastName: (user as User).lastName || (user as Record<string, unknown>)['lastName'],
              userName: (user as User).userName || String((user as User).email || (user as Record<string, unknown>)['email']).split('@')[0],
              email: (user as User).email || (user as Record<string, unknown>)['email'] // ← POVINNE pre backend
            };

            if ((user as User).companyId !== undefined && (user as User).companyId !== null) {
              body['companyId'] = (user as User).companyId;
            } else if ((user as User).companyName || (user as Record<string, unknown>)['companyName']) {
              body['companyName'] = (user as User).companyName || (user as Record<string, unknown>)['companyName'];
            }

            // Zavolaj backend /api/auth/register s Firebase tokenom
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

                // Ak uzivatel uz existuje (409), uprav firstName/lastName a pokracuj
                if (backendError.status === 409) {
                  return from(userCredential.user.getIdToken()).pipe(
                    switchMap((token: string) => {
                      // Najprv ziskaj pouzivatela podla emailu, aby si ziskal jeho ID
                      return this.http.get<FlexibleUserResponse>(
                        `${this.baseUrl}/Users/by-email/${encodeURIComponent(userCredential.user.email!)}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      ).pipe(
                        switchMap((existingUser) => {
                          // Uprav pouzivatela novym firstName/lastName
                          return this.http.patch<ApiUser>(
                            `${this.baseUrl}/Users/${existingUser.id}`,
                            {
                              firstName: (user as User).firstName,
                              lastName: (user as User).lastName
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
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

                // Pre ine chyby sprav rollback Firebase pouzivatela
                return from(deleteUser(firebaseUser)).pipe(
                  switchMap(() => throwError(() => backendError)),
                  catchError(() => throwError(() => backendError)) // Aj ked zmazanie zlyha, vyhod backend error
                );
              })
            );
          })
        );
      }),
      switchMap((registrationResult) => {
        // Po uspesnej registracii inicializuj auth stav
        return this.initializeAuthState().pipe(
          map(() => registrationResult) // Vrat povodne registration data
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
    // Username je email v login formulari
    const expectedEmail = credentials.username.toLowerCase().trim();

    return from(
      signInWithEmailAndPassword(auth, credentials.username, credentials.password)
    ).pipe(
      switchMap(() => {
        // Reset predoslych chyb
        this.authError.next(null);

        // Po Firebase logine pockaj na onAuthStateChanged callback,
        // ktory automaticky nacita user data cez /api/auth/me
        // KRITICKE: Musi pockat na SPRAVNEHO uzivatela (porovnaj email)

        const successLog$ = this.currentUser$.pipe(
          filter(user => {
            if (user === null) return false;
            const isCorrectUser = user.email?.toLowerCase() === expectedEmail;
            return isCorrectUser;
          }),
          take(1)
        );

        const errorLog$ = this.authError.pipe(
          filter(err => err !== null),
          take(1),
          switchMap(err => throwError(() => new Error(err!)))
        );

        return race(successLog$, errorLog$).pipe(
          timeout(10000), // Cakaj max 10 sekund na nacitanie user dat, potom timeout
          switchMap(user => {
            // TypeScript guard - race hodi error, ak vyhra errorLog$, takze user je tu User
            const u = user as User;

            if (!u) {
              return throwError(() => new Error('User not found'));
            }
            // Zamestnavatelia (role === 1) su auto-approved
            // Iba blokuj zamestnancov (role === 0) ktori niesu schvaleni
            if (u.role !== 1 && u.isApproved === false) {
              return throwError(() => new Error('Your account is pending approval by your employer.'));
            }
            return of({
              success: true,
              user: u
            });
          })
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
        } else if (error instanceof Error && error.message.includes('pending approval')) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Inicializuje auth stav bez vynutenia logoutu
   * Spusti onAuthStateChanged callback, aby sa prednacitali user data do cache
   * Pouzite po registracii na nacitanie user dat pred tym, nez uzivatel pokracuje
   */
  initializeAuthState(): Observable<void> {
    return new Observable(observer => {
      // onAuthStateChanged je uz nastavene v konstruktore
      // Len pockaj, aby sa Firebase session stabilizovala
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  /**
   * Odhlasenie uzivatela
   * Vymaze Firebase session a resetuje currentUser
   */
  logout(): Observable<void> {
    // Jednoduche odhlasenie - iba Firebase signOut
    this.currentUser.next(null);

    // Zrus predplatne
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
      this.currentUserSubscription = null;
    }

    return from(signOut(auth));
  }

  /**
   * Vycisti localStorage, sessionStorage a selektivne Firebase cache
   * Vracia Promise, aby sa dalo pockat na dokoncenie
   */
  private clearAllCache(): Promise<void> {
    return new Promise((resolve) => {
      // 1. Zachovaj nastavenie temy pred vycistenim
      let savedTheme: string | null = null;
      try {
        savedTheme = localStorage.getItem('theme');
      } catch (e) {
        console.warn('Failed to read theme setting:', e);
      }

      // 2. Vycisti Web Storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('localStorage and sessionStorage cleared');
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }

      // 3. Obnov nastavenie temy hned po vycisteni
      if (savedTheme) {
        try {
          localStorage.setItem('theme', savedTheme);
          console.log('Theme setting restored:', savedTheme);
        } catch (e) {
          console.warn('Could not restore theme setting:', e);
        }
      }

      // 4. Vycisti iba kriticke Firebase IndexedDB (nie vsetky)
      const dbPromise = this.clearCriticalFirebaseDB();

      // 5. Vycisti Service Worker cache
      let cachePromise = Promise.resolve();
      if ('caches' in window) {
        cachePromise = caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName =>
              caches.delete(cacheName).then(() => {
                console.log(`Cache cleared: ${cacheName}`);
              })
            )
          );
        }).then(() => { /* cache cleared */ }).catch(e => {
          console.warn('Error clearing service worker cache:', e);
        });
      }

      // Pockaj na vsetky async operacie + maly delay pre istotu
      Promise.all([dbPromise, cachePromise]).then(() => {
        // Maly delay, aby sa IndexedDB operacie stihli dokoncit
        setTimeout(() => {
          console.log('All cache cleared successfully (with delay)');
          resolve();
        }, 300);
      }).catch(() => {
        console.warn('Some cache clearing failed, but continuing...');
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
        // Iba kriticke databazy, ktore mozu obsahovat staru relaciu
        const criticalDBs = [
          'firebaseLocalStorageDb' // <- KRITICKE: Firebase Auth tu uklada relaciu
        ];

        const deletePromises = criticalDBs.map((dbName) => {
          return new Promise<void>((resolveDb) => {
            if (indexedDB && indexedDB.deleteDatabase) {
              try {
                const request = indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => {
                  console.log(`Critical Firebase IndexedDB cleared: ${dbName}`);
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
          console.log('Critical Firebase IndexedDB cleared');
          resolve();
        });
      } catch (e) {
        console.warn('Error while clearing critical Firebase IndexedDB:', e);
        resolve();
      }
    });
  }

  /**
   * Vycisti Firebase IndexedDB databazy
   * Potrebne, aby sa stary cached user data nenacital pri dalsom login-e
   * KRITICKE: Zahrna firebaseLocalStorageDb kde Firebase Auth uklada relaciu
   */
  private clearFirebaseIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const firebaseDBs = [
          'firebaseLocalStorageDb', // <- KRITICKE: Firebase Auth tu uklada session
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
                  console.log(`Firebase IndexedDB cleared: ${dbName}`);
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
        let message = 'Password reset failed';
        if (error.code === 'auth/user-not-found') {
          message = 'User not found';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Invalid email';
        }
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Vrati aktualneho uzivatela
   */
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  /**
   * Skontroluje, ci je uzivatel prihlaseny
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
          console.warn(`Unknown role: ${roleString}, defaulting to Employee`);
          return 0;
      }
    }

    // Predvolene Employee
    return 0;
  }

  /**
   * Dodatocne cistenie uloziska pre istotu - iba problematicke kluce
   * Nevymazava vsetky Firebase kluce, aby nenarusilo nove prihlasenia
   */
  private forceExtraStorageClearing(): void {
    try {
      // Iba specificke kluce, ktore mozu sposobovat problemy s logout/login
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
          console.log(`Removed problematic key: ${key}`);
        } catch (e) {
          console.warn(`Could not remove ${key}:`, e);
        }
      });

      console.log('✅ Selective storage cleanup completed');
    } catch (e) {
      console.warn('⚠️ Selective storage cleanup failed:', e);
    }
  }

  /**
   * Ziska vsetky pending pouzivatelov pre firmu zamestnavatela
   * Pristupne iba pre employer rolu
   */
  getPendingUsers(): Observable<unknown[]> {
    const token = auth.currentUser?.getIdToken() || from(auth.currentUser!.getIdToken());
    return from(token).pipe(
      switchMap((t: string) =>
        this.http.get<unknown[]>(`${this.baseUrl}/admin/pending-users`, {
          headers: { Authorization: `Bearer ${t}` }
        })
      ),
      catchError(error => {
        console.error('Failed to fetch pending users:', error);
        return throwError(() => new Error('Failed to fetch pending users'));
      })
    );
  }

  /**
   * Schvali pending pouzivatela zamestnavatelom
   */
  approveUser(userId: number): Observable<unknown> {
    const token = auth.currentUser?.getIdToken() || from(auth.currentUser!.getIdToken());
    return from(token).pipe(
      switchMap((t: string) =>
        this.http.post(`${this.baseUrl}/admin/approve-user/${userId}`, {}, {
          headers: { Authorization: `Bearer ${t}` }
        })
      ),
      catchError(error => {
        console.error('Failed to approve user:', error);
        return throwError(() => new Error('Failed to approve user'));
      })
    );
  }

  /**
   * Zamietne pending pouzivatela zamestnavatelom (zmaze uzivatela)
   */
  rejectUser(userId: number): Observable<unknown> {
    const token = auth.currentUser?.getIdToken() || from(auth.currentUser!.getIdToken());
    return from(token).pipe(
      switchMap((t: string) =>
        this.http.post(`${this.baseUrl}/admin/reject-user/${userId}`, {}, {
          headers: { Authorization: `Bearer ${t}` }
        })
      ),
      catchError(error => {
        console.error('Failed to reject user:', error);
        return throwError(() => new Error('Failed to reject user'));
      })
    );
  }
}
