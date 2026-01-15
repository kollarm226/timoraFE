import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
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

/**
 * Auth service - authentication and authorization
 * Uses Firebase Authentication
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl || 'https://timorabe.azurewebsites.net/api';
  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();
  private currentUserSubscription: any = null; // Track active subscription

  constructor() {
    // Monitor authentication state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      console.log('onAuthStateChanged triggered, firebaseUser:', firebaseUser?.email || 'null');
      
      // Ak existuje starý subscription, zruš ho - aby sa nenačítavali stare údaje
      if (this.currentUserSubscription) {
        console.log('Unsubscribing from previous user fetch...');
        this.currentUserSubscription.unsubscribe();
        this.currentUserSubscription = null;
      }
      
      if (firebaseUser && firebaseUser.email) {
        // CRITICAL: Najskôr vyčisti currentUser aby sa predišlo race condition so starými datami
        console.log('Clearing old user data before fetching new user...');
        this.currentUser.next(null);
        
        // User je prihlaseny - nacitaj jeho data z backendu cez /api/auth/me endpoint
        console.log('User logged in:', firebaseUser.email, '- fetching user data from backend...');
        
        const expectedEmail = firebaseUser.email; // Ulož email na validáciu
        
        const userSubscription = from(firebaseUser.getIdToken(true)).pipe( // true = force refresh token
          switchMap((token: string) => {
            console.log('Got Firebase token, calling /api/auth/me...');
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
            console.log('=== USER LOADED FROM BACKEND ===');
            console.log('Full response:', JSON.stringify(apiUser, null, 2));
            console.log('Response keys:', Object.keys(apiUser));
            
            // Skúšaj všetky možné názvy polí
            console.log('--- Possible ID fields ---');
            console.log('UserId:', (apiUser as any).UserId);
            console.log('userId:', (apiUser as any).userId);
            console.log('id:', (apiUser as any).id);
            console.log('ID:', (apiUser as any).ID);
            
            console.log('--- Possible Name fields ---');
            console.log('FirstName:', (apiUser as any).FirstName);
            console.log('firstName:', (apiUser as any).firstName);
            console.log('first_name:', (apiUser as any).first_name);
            console.log('LastName:', (apiUser as any).LastName);
            console.log('lastName:', (apiUser as any).lastName);
            console.log('last_name:', (apiUser as any).last_name);
            
            console.log('--- Email ---');
            console.log('Email:', (apiUser as any).Email);
            console.log('email:', (apiUser as any).email);
            
            // Validuj že načítaný user je ten správny
            const responseEmail = (apiUser as any).Email || (apiUser as any).email;
            if (responseEmail !== expectedEmail) {
              console.error('🔴 Email mismatch! Expected:', expectedEmail, 'Got:', responseEmail);
              console.error('Security issue: Backend returned wrong user data!');
              throw new Error(`Email mismatch: expected ${expectedEmail}, got ${responseEmail}`);
            }
            
            const user: User = {
              id: (apiUser as any).UserId || (apiUser as any).userId || (apiUser as any).id,
              companyId: (apiUser as any).CompanyId || (apiUser as any).companyId,
              firstName: (apiUser as any).FirstName || (apiUser as any).firstName || (apiUser as any).first_name,
              lastName: (apiUser as any).LastName || (apiUser as any).lastName || (apiUser as any).last_name,
              email: responseEmail,
              address: '',
              password: '',
              role: this.mapRoleStringToNumber((apiUser as any).Role || (apiUser as any).role)
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
   * 1. Vyčistí cache aby sa nenačítali stare user data
   * 2. Vytvori usera v Firebase
   * 3. Ziska Firebase token
   * 4. Odosle POST /api/auth/register na backend (s companyId alebo companyName)
   * 5. Ak backend zlyhá, odstrani usera z Firebase (rollback)
   */
  register(user: User | any): Observable<{ success: boolean; user: any }> {
    // CRITICAL: Vyčisti všetky cache PRED registráciou a POČKAJ na dokončenie
    console.log('Clearing all cache before registration...');
    
    return from(this.clearAllCache()).pipe(
      switchMap(() => {
        console.log('Cache cleared, proceeding with Firebase registration...');
        return from(createUserWithEmailAndPassword(auth, user.email, user.password));
      }),
      switchMap((userCredential: UserCredential) => {
        // Store the Firebase credential for potential rollback
        const firebaseUser = userCredential.user;
        // Set displayName so it's preserved in Firebase for later use
        const displayName = `${user.companyId || 'default'}|${user.firstName} ${user.lastName}`;
        return from(updateProfile(firebaseUser, { displayName })).pipe(
          switchMap(() => from(userCredential.user.getIdToken())),
          switchMap((token: string) => {
            // Prepare request body depending on companyId or companyName
            let body: any = {
              firstName: user.firstName,
              lastName: user.lastName,
              userName: user.userName || user.email.split('@')[0],
              email: user.email  // ← REQUIRED by backend!
            };

            if (user.companyId !== undefined && user.companyId !== null) {
              body.companyId = user.companyId;
              console.log('Register: Joining existing company with ID:', user.companyId);
            } else if (user.companyName) {
              body.companyName = user.companyName;
              console.log('Register: Creating new company with name:', user.companyName);
            }
            
            console.log('Register request body:', body);

            // Volaj backend /api/auth/register s Firebase tokenом
            return this.http.post<{ success: boolean; user: any }>(
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
                      return this.http.get<ApiUser>(`${this.baseUrl}/Users/by-email/${encodeURIComponent(userCredential.user.email!)}`, {
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
   * 1. Vyčistí cache aby sa nenačítali stare user data
   * 2. Prihlási cez Firebase (email + heslo)
   * 3. onAuthStateChanged callback automaticky načíta user data z /api/auth/me
   * 4. Čaká kým sa user načíta a potom vráti success response
   */
  login(credentials: { username: string; password: string }): Observable<{ success: boolean; user: User }> {
    // CRITICAL: Vyčisti všetky cache PRED login-om aby sa nenačítali stare user data
    console.log('Clearing all cache before login...');
    this.clearAllCache();

    // username je email v login formu
    const expectedEmail = credentials.username.toLowerCase().trim();
    
    return from(
      signInWithEmailAndPassword(auth, credentials.username, credentials.password)
    ).pipe(
      switchMap((userCredential: UserCredential) => {
        console.log('Firebase sign-in successful, waiting for user data...');
        
        // Po Firebase prihlásení čakaj na onAuthStateChanged callback
        // ktorý automaticky načíta user data cez /api/auth/me
        // CRITICAL: Musíme čakať na SPRÁVNEHO usera (porovnaj email)
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
   * Vyčistí Firebase session, resetuje currentUser a vymaže ALL cache
   * - localStorage, sessionStorage
   * - Firebase IndexedDB
   * - Service Worker cache
   */
  logout(): Observable<void> {
    return from(signOut(auth)).pipe(
      switchMap(() => {
        // Vyčisti currentUser
        this.currentUser.next(null);
        console.log('User logged out and currentUser cleared');
        
        // Vyčisti subscription
        if (this.currentUserSubscription) {
          this.currentUserSubscription.unsubscribe();
          this.currentUserSubscription = null;
        }
        
        // Vyčisti všetky typy cache a POČKAJ na dokončenie
        return from(this.clearAllCache());
      }),
      catchError(error => {
        console.error('Logout error:', error);
        // Aj keď logout zlyhá, vyčisti všetko
        this.currentUser.next(null);
        if (this.currentUserSubscription) {
          this.currentUserSubscription.unsubscribe();
          this.currentUserSubscription = null;
        }
        return from(this.clearAllCache()).pipe(
          switchMap(() => throwError(() => error))
        );
      })
    );
  }

  /**
   * Vyčistí localStorage, sessionStorage, Firebase IndexedDB a service worker cache
   * Vracia Promise aby sa dalo čakať na dokončenie
   */
  private clearAllCache(): Promise<void> {
    return new Promise((resolve) => {
      // 1. Vyčisti Web Storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Cleared localStorage and sessionStorage');
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }

      // 2. Vyčisti Firebase IndexedDB (async)
      const dbPromise = this.clearFirebaseIndexedDB();

      // 3. Vyčisti Service Worker cache
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
        }).then(() => {}).catch(e => {
          console.warn('Error clearing service worker cache:', e);
        });
      }

      // Počkaj na všetky async operácie
      Promise.all([dbPromise, cachePromise]).then(() => {
        console.log('All cache cleared successfully');
        resolve();
      }).catch(() => {
        console.warn('Some cache clearing failed, but continuing...');
        resolve();
      });
    });
  }

  /**
   * Vyčistí Firebase IndexedDB databases
   * Potrebné aby sa stary cached user data nenacital pri dalsom login-e
   * CRITICAL: Zahŕňa firebaseLocalStorageDb kde Firebase Auth ukladá session!
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
   * Password reset via Firebase - sends reset link to email
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

  /**
   * Mapuje string rolu z backendu na číselné hodnoty
   * Backend vracia: "Employee", "Employer", "Admin"
   * Frontend očakáva: 0=Employee, 1=Employer, 2=Admin
   */
  private mapRoleStringToNumber(roleString: string | number | undefined): number {
    // Ak je to už číslo, vráť ho
    if (typeof roleString === 'number') {
      return roleString;
    }

    // Ak je to string, mapuj na číslo
    if (typeof roleString === 'string') {
      switch (roleString.toLowerCase()) {
        case 'employee':
          return 0;
        case 'employer':
          return 1;
        case 'admin':
          return 2;
        default:
          console.warn(`Unknown role string: ${roleString}, defaulting to Employee`);
          return 0;
      }
    }

    // Fallback na Employee
    return 0;
  }
}
