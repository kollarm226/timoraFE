import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { HolidayRequest, Notice } from '../../models/api.models';

/**
 * Dashboard komponent - hlavna stranka po prihlaseni
 * Zobrazuje prehled dovoleniek a aktualnych oznameni
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  
  displayedColumns = ['start', 'end', 'status'];
  vacations: HolidayRequest[] = [];
  notices: Notice[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Nacita data z backendu (dovolenky a oznamenia)
   */
  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Nacitanie dovoleniek
    this.apiService.getHolidayRequests().subscribe({
      next: (data) => {
        this.vacations = data;
        this.loading = false;
      },
      error: (err) => {
        this.handleError('Error loading holiday requests', err);
      }
    });

    // Nacitanie oznameni
    this.apiService.getNotices().subscribe({
      next: (data) => {
        // Zobraz len aktivne oznamenia, max 3
        this.notices = data.filter(n => n.isActive).slice(0, 3);
      },
      error: (err) => {
        this.handleError('Error loading notices', err);
      }
    });
  }

  /**
   * Spracovanie chyby pri nacitani dat
   */
  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    
    // Extract user-friendly message from error
    let userMessage = 'Failed to load data from the backend';
    if (typeof error === 'object' && error !== null && 'message' in error) {
      userMessage = (error as { message: string }).message;
    }
    
    this.error = userMessage;
    this.loading = false;
  }

  /**
   * Formatovanie datumu do slovenciny
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('sk-SK', { 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
