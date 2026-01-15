import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { HolidayRequest, Notice } from '../../models/api.models';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subject, takeUntil } from 'rxjs';

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
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private destroy$ = new Subject<void>();
  
  displayedColumns = ['start', 'end', 'status'];
  vacations: HolidayRequest[] = [];
  private allVacations: HolidayRequest[] = [];
  private currentUser: User | null = null;
  notices: Notice[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        // If we have user without id, try to enrich from backend by email
        if (user && !user.id && user.email) {
          this.apiService.getUserByEmail(user.email).subscribe({
            next: apiUser => {
              this.currentUser = { ...user, id: apiUser.id, role: apiUser.role ?? user.role };
              this.filterVacations();
            },
            error: () => {
              // silent fallback; keep filtering best-effort
              this.filterVacations();
            }
          });
        } else {
          this.filterVacations();
        }

        if (!this.allVacations.length) {
          this.loadDashboardData();
        }
      });

    this.loadDashboardData();
    
    // Refresh dashboard data každých 10 sekúnd aby sa zobrazili nové dovolenky
    const refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 10000);
    
    // Vyčisti interval pri destroy
    this.destroy$.subscribe(() => {
      clearInterval(refreshInterval);
    });
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
        this.allVacations = data;
        this.filterVacations();
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

  private filterVacations(): void {
    if (!this.allVacations) return;
    const userId = this.currentUser?.id;
    console.log('filterVacations - currentUser:', this.currentUser, 'userId:', userId, 'allVacations count:', this.allVacations.length);
    
    if (userId) {
      console.log('🔍 Debugging filter:');
      this.allVacations.forEach((v, idx) => {
        console.log(`  Vacation[${idx}]: userId=${v.userId} (type: ${typeof v.userId}), currentUserId=${userId} (type: ${typeof userId}), match=${v.userId === userId || String(v.userId) === String(userId)}`);
      });
      
      // Try both number and string comparison
      this.vacations = this.allVacations.filter(v => {
        const isMatch = v.userId === userId || String(v.userId) === String(userId);
        return isMatch;
      });
      console.log('Filtered vacations:', this.vacations);
      return;
    }

    // Fallback: if no user id, attempt to keep list empty to avoid exposing others
    console.warn('No userId available, vacations list will be empty');
    this.vacations = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   * Formatovanie datumu pre anglicky vystup
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long', 
      day: 'numeric' 
    });
  }

  getStatusView(status: unknown): { label: string; class: string } {
    const normalized = typeof status === 'number'
      ? status.toString()
      : (status ?? '').toString().trim();
    const lower = normalized.toLowerCase();

    if (lower === '1' || lower === 'approved') {
      return { label: 'Approved', class: 'approved' };
    }

    if (lower === '2' || lower === 'rejected' || lower === 'denied') {
      return { label: 'Denied', class: 'denied' };
    }

    if (lower === '3' || lower === 'cancelled' || lower === 'canceled') {
      return { label: 'Cancelled', class: 'cancelled' };
    }

    return { label: 'Pending', class: 'pending' };
  }
}
