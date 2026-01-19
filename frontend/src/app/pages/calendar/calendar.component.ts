import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HolidayRequest } from '../../models/api.models';

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
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
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
  currentUserId: number | null = null;

  constructor() {
    this.vacationForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    }, { validators: this.dateRangeValidator() });
  }

  ngOnInit(): void {
    // Ziskaj aktuálneho usera z AuthService
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
        console.log('Current user ID set:', this.currentUserId);
      }
    });

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
   * Teraz používa user ID z AuthService - bez komplikovaného getUser volania
   */
  onSubmit(): void {
    if (!this.vacationForm.valid) {
      return;
    }

    // Skontroluj ci mame user ID
    if (!this.currentUserId) {
      alert('You are not properly logged in. Please refresh the page.');
      return;
    }

    const formValue = this.vacationForm.value;
    this.loading = true;

    // Prepare backend payload with UTC-normalized dates
    const startDate = this.toUtcIso(formValue.startDate, false);
    const endDate = this.toUtcIso(formValue.endDate, true);

    const requestData = {
      userId: Number(this.currentUserId),  // Ensure it's a number, not a string
      startDate: startDate,
      endDate: endDate,
      reason: formValue.reason
    };

    console.log('Sending holiday request:', requestData);

    // Posli request na vytvorenie holiday requestu
    this.apiService.createHolidayRequest(requestData).subscribe({
      next: () => {
        this.loading = false;
        alert('Vacation request sent successfully!');
        this.vacationForm.reset();
        this.loadMyRequests(); // Obnov zoznam requestov
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creating holiday request:', err);

        // Vypisuj detailne validacne chyby z backendu
        if (err.error && err.error.errors) {
          console.error('Validation errors:', JSON.stringify(err.error.errors, null, 2));
          Object.keys(err.error.errors).forEach(key => {
            console.error(`Field "${key}":`, err.error.errors[key]);
          });
        }

        let userMessage = 'Failed to submit the request';
        if (typeof err === 'object' && err !== null && 'error' in err) {
          const errorObj = err as { error?: { message?: string; title?: string } };
          userMessage = errorObj.error?.message || errorObj.error?.title || userMessage;
        }
        alert(userMessage);
      }
    });
  }

  /**
   * Validator - datum zaciatku musi byt striktne pred datumom konca
   */
  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startControl = group.get('startDate');
      const endControl = group.get('endDate');
      const start = startControl?.value as Date | string | null;
      const end = endControl?.value as Date | string | null;

      if (!start || !end) {
        this.clearInvalidDateError(endControl);
        return null;
      }

      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();

      if (isNaN(startTime) || isNaN(endTime)) {
        this.clearInvalidDateError(endControl);
        return null;
      }

      const invalid = startTime > endTime;
      if (invalid) {
        this.applyInvalidDateError(endControl);
        return { invalidDateOrder: true };
      }

      this.clearInvalidDateError(endControl);
      return null;
    };
  }

  private toUtcIso(dateValue: Date | string, endOfDay: boolean): string {
    if (!dateValue) return '';

    // If already an ISO datetime string, keep as is
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue;
    }

    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    const hours = endOfDay ? 23 : 0;
    const minutes = endOfDay ? 59 : 0;
    const seconds = endOfDay ? 59 : 0;
    const ms = endOfDay ? 999 : 0;

    return new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms)).toISOString();
  }

  private applyInvalidDateError(control?: AbstractControl | null): void {
    if (!control) return;
    const current = control.errors || {};
    control.setErrors({ ...current, invalidDateOrder: true });
  }

  private clearInvalidDateError(control?: AbstractControl | null): void {
    if (!control || !control.errors) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { invalidDateOrder, ...rest } = control.errors;
    if (Object.keys(rest).length === 0) {
      control.setErrors(null);
    } else {
      control.setErrors(rest);
    }
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
