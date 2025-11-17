import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { HolidayRequest, Notice } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  
  displayedColumns = ['start', 'end', 'status'];
  vacations: HolidayRequest[] = [];
  notices: Notice[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    // Load holiday requests
    this.apiService.getHolidayRequests().subscribe({
      next: (data) => {
        this.vacations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading holiday requests:', err);
        this.error = 'Failed to load data from the backend';
        this.loading = false;
      }
    });

    // Load notices
    this.apiService.getNotices().subscribe({
      next: (data) => {
        this.notices = data.filter(n => n.isActive).slice(0, 3);
      },
      error: (err) => {
        console.error('Error loading notices:', err);
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('sk-SK', { month: 'long', day: 'numeric' });
  }
}
