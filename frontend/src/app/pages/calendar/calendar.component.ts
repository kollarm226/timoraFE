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
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);

  vacationForm: FormGroup;
  myRequests: HolidayRequest[] = [];
  loading = false;
  markedDates: Date[] = [];
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;

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
    
    // TODO: Implementovat POST endpoint na backende
    console.log('Vacation request:', formValue);
    alert('Vacation request submitted! (API integration pending)');
    
    this.vacationForm.reset();
  }

  /**
   * Vrati CSS triedu podla statusu dovolenky
   */
  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}
