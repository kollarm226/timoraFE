import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HolidayRequest } from '../../models/api.models';
import { switchMap, catchError, map } from 'rxjs/operators';
import { throwError, from } from 'rxjs';
import { auth } from '../../config/firebase.config';

/**
 * Calendar komponent - planovanie dovoleniek
 * Umoznuje prezerat existujuce dovolenky v kalendari a vytvorat nove ziadosti
 */
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  vacationForm: FormGroup;
  myRequests: HolidayRequest[] = [];
  loading = false;
  markedDates: Date[] = [];
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  isSelectingEndDate = false;

  constructor() {
    this.vacationForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadMyRequests();
  }

  /**
   * Nacita ziadosti o dovolenku z backendu
   */
  private loadMyRequests(): void {
    this.loading = true;

    this.apiService.getHolidayRequests().subscribe({
      next: (data) => {
        this.myRequests = data;
        this.updateMarkedDates();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading vacation requests:', err);
        // Extract user-friendly message from error
        let userMessage = 'Failed to load vacation requests';
        if (typeof err === 'object' && err !== null && 'message' in err) {
          userMessage = (err as { message: string }).message;
        }
        alert(userMessage);
        this.loading = false;
      }
    });
  }

  /**
   * Aktualizuje oznacene datumy v kalendari na zaklade nacitanych dovoleniek
   */
  private updateMarkedDates(): void {
    this.markedDates = [];

    this.myRequests.forEach(req => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);

      // Pridaj vsetky dni medzi startDate a endDate
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        this.markedDates.push(new Date(d));
      }
    });
  }

  /**
   * Funkcia pre Angular Material calendar - prida CSS triedu pre oznacene dni
   */
  dateClass = (date: Date): string => {
    const time = date.getTime();
    const isMarked = this.markedDates.some(d => d.getTime() === time);
    return isMarked ? 'marked-date' : '';
  }

  /**
   * Odoslanie formulara so ziadostou o dovolenku
   */
  onSubmit(): void {
    if (!this.vacationForm.valid) {
      return;
    }

    const formValue = this.vacationForm.value;
    this.loading = true;

    // Ziskaj email z Firebase auth
    const firebaseUser = auth.currentUser;

    if (!firebaseUser || !firebaseUser.email) {
      this.loading = false;
      alert('Nie ste prihlaseny');
      return;
    }

    // Ziskaj Firebase ID token pred volanim API
    from(firebaseUser.getIdToken(true)).pipe(
      switchMap(token => {
        console.log('Firebase token obtained, proceeding with holiday request...');
        
        // Teraz mozeme bezpecne volat API s platnym tokenom (interceptor ho pridam do headera)
        return this.apiService.getUserByEmail(firebaseUser.email!);
      }),
      catchError((error) => {
        console.error('GetUserByEmail error:', error);

        // Ak API vrati 500 (asi bug v backende), skusme najst usera v zozname vsetkych userov
        if (error.status === 500) {
          console.log('Backend returned 500, trying to find user in full list...');
          return this.apiService.getUsers().pipe(
            map(users => {
              const foundUser = users.find(u => u.email && u.email.toLowerCase() === firebaseUser.email!.toLowerCase());
              if (foundUser) {
                console.log('User found in full list:', foundUser);
                return foundUser; // Vratime najdeneho usera
              }
              // Ak nenajdeme, vyhodime 404 aby sa spustila logika pre vytvorenie
              throw { status: 404, message: 'User not found in list' };
            }),
            catchError(usersError => {
              console.error('Error fetching users list:', usersError);
              // Ak aj getUsers zlyha (napr. na 500), hodime 404 aby sme prinutili frontend vytvorit usera nanovo
              // Toto je posledna zachrana ked backend fakt nefunguje
              throw { status: 404, message: 'Fallback to creation' };
            })
          );
        }
        return throwError(() => error);
      }),
      catchError((error) => {
        // Ak user neexistuje v backendu (404), vytvor ho
        if (error.status === 404) {
          console.log('User not found in backend (404), creating...');

          // Parse displayName alebo pouzij defaults
          let firstName = 'User';
          let lastName = 'User';

          if (firebaseUser.displayName) {
            const parts = firebaseUser.displayName.split('|');
            if (parts.length > 1) {
              const nameParts = parts[1].split(' ');
              firstName = nameParts[0] || 'User';
              lastName = nameParts[1] || 'User';
            }
          }

          // Najskor ziskaj prvu company z backendu
          return this.apiService.getCompanies().pipe(
            switchMap(companies => {
              // Ak neexistuju companies, vytvor default
              if (companies.length === 0) {
                console.log('No companies found, creating default company...');
                return this.apiService.createCompany({ name: 'Default Company' }).pipe(
                  switchMap(newCompany => {
                    const newUser = {
                      firebaseId: firebaseUser.uid,
                      companyId: newCompany.id,
                      firstName: firstName,
                      lastName: lastName,
                      email: firebaseUser.email!,
                      userName: firebaseUser.email!.split('@')[0],
                      role: 0 // Employee enum value
                    };

                    console.log('Creating user with data:', newUser);
                    return this.apiService.createUser(newUser);
                  })
                );
              }

              const newUser = {
                firebaseId: firebaseUser.uid,
                companyId: companies[0].id, // Pouzij ID prvej company
                firstName: firstName,
                lastName: lastName,
                email: firebaseUser.email!,
                userName: firebaseUser.email!.split('@')[0],
                role: 0 // Employee enum value
              };

              console.log('Creating user with data:', newUser);

              // Vytvor usera a vrat ho
              return this.apiService.createUser(newUser);
            })
          );
        }
        return throwError(() => error);
      }),
      switchMap(user => {
        // Pripravi data pre backend s realnym userId
        // Konvertuj Date objekty na ISO datetime format
        let startDate: string;
        let endDate: string;

        if (formValue.startDate instanceof Date) {
          startDate = formValue.startDate.toISOString();
        } else {
          startDate = formValue.startDate.includes('T') 
            ? formValue.startDate 
            : `${formValue.startDate}T00:00:00.000Z`;
        }

        if (formValue.endDate instanceof Date) {
          endDate = formValue.endDate.toISOString();
        } else {
          endDate = formValue.endDate.includes('T') 
            ? formValue.endDate 
            : `${formValue.endDate}T23:59:59.999Z`;
        }

        const requestData = {
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
          reason: formValue.reason
        };

        console.log('Sending holiday request:', requestData);
        // Posli request na vytvorenie holiday requestu
        return this.apiService.createHolidayRequest(requestData);
      })
    ).subscribe({
      next: (response) => {
        this.loading = false;
        alert('Ziadost o dovolenku bola uspesne odoslana!');
        this.vacationForm.reset();
        this.loadMyRequests(); // Obnov zoznam requestov
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creating holiday request:', err);

        // Vypisuj detailne validacne chyby z backendu
        if (err.error && err.error.errors) {
          console.error('Validation errors:', JSON.stringify(err.error.errors, null, 2));

          // Vypis kazdu validacnu chybu samostatne
          Object.keys(err.error.errors).forEach(key => {
            console.error(`Field "${key}":`, err.error.errors[key]);
          });
        }

        let userMessage = 'Nepodarilo sa odoslat ziadost';
        if (typeof err === 'object' && err !== null && 'error' in err) {
          const errorObj = err as { error?: { message?: string; title?: string } };
          userMessage = errorObj.error?.message || errorObj.error?.title || userMessage;
        }
        alert(userMessage);
      }
    });
  }

  /**
   * Vrati CSS triedu podla statusu dovolenky
   */
  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  /**
   * Obsluha kliknutia na datum v kalendari
   * Prvy klik nastavi Start Date, druhy klik nastavi End Date
   */
  onDateSelected(date: Date | null): void {
    if (!date) return; // Ignoruj null hodnoty

    if (!this.isSelectingEndDate) {
      // Prvy klik - nastav Start Date
      this.selectedStartDate = date;
      this.vacationForm.patchValue({ startDate: date });
      this.isSelectingEndDate = true;
    } else {
      // Druhy klik - nastav End Date
      this.selectedEndDate = date;
      this.vacationForm.patchValue({ endDate: date });
      this.isSelectingEndDate = false;
    }
  }
}
