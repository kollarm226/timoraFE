import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { HolidayRequest, Notice, ApiUser } from '../../models/api.models';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subject, takeUntil, forkJoin } from 'rxjs';

/**
 * Dashboard komponent - hlavna stranka po prihlaseni
 * Zobrazuje prehlad dovoleniek a aktualnych oznameni
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatCardModule, MatIconModule, DatePipe],
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
  employer: ApiUser | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        // Ak mame usera bez id, skus obohacit z backendu cez email
        if (user && !user.id && user.email) {
          this.apiService.getUserByEmail(user.email).subscribe({
            next: apiUser => {
              this.currentUser = { ...user, id: apiUser.id, role: apiUser.role ?? user.role };
              this.filterVacations();
            },
            error: () => {
              // tichy fallback; pokracuj s filtrom co sa da
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
    
    // Obnov dashboard data kazdych 10 sekund aby sa zobrazili nove dovolenky
    const refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 10000);
    
    // Vycisti interval pri destroy
    this.destroy$.subscribe(() => {
      clearInterval(refreshInterval);
    });
  }

  /**
   * Nacita data z backendu (dovolenky, oznamenia, users a companies)
   */
  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Nacitanie vsetkych dat naraz
    forkJoin({
      holidayRequests: this.apiService.getHolidayRequests(),
      notices: this.apiService.getNotices(),
      users: this.apiService.getUsers()
    }).subscribe({
      next: ({ holidayRequests, notices, users }) => {
        // Dovolenky
        this.allVacations = holidayRequests;
        this.filterVacations();

        // Oznamenia
        this.notices = notices.slice(0, 3);

        // Najdi zamestnavatela
        this.findEmployer(users);
        
        this.loading = false;
      },
      error: (err) => {
        this.handleError('Error loading dashboard data', err);
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

  /**
   * Vrati meno autora oznamenia
   */
  getAuthorName(notice: Notice): string {
    if (notice.user) {
      return `${notice.user.firstName} ${notice.user.lastName}`;
    }
    return 'Unknown author';
  }

  /**
   * Skrati text oznamenia na max pocet znakov
   */
  truncateContent(content: string, maxLength = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Skontroluje ci je notice neprecitane (nove)
   */
  isNoticeUnread(noticeId: number): boolean {
    const readNotices = this.getReadNotices();
    return !readNotices.includes(noticeId);
  }

  /**
   * Oznaci notice ako precitane
   */
  markNoticeAsRead(noticeId: number): void {
    const readNotices = this.getReadNotices();
    if (!readNotices.includes(noticeId)) {
      readNotices.push(noticeId);
      localStorage.setItem('readNotices', JSON.stringify(readNotices));
    }
  }

  /**
   * Ziska zoznam precitanych notices z localStorage
   */
  private getReadNotices(): number[] {
    const stored = localStorage.getItem('readNotices');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Handler pre kliknutie na notice - oznaci ako precitane a zobrazi detail
   */
  onNoticeClick(notice: Notice, event: Event): void {
    event.preventDefault();
    this.markNoticeAsRead(notice.id);
    
    // Mozete pridat dalsiu logiku - napr. navigacia na detail alebo modal
    console.log('Notice clicked:', notice.title);
  }

  /**
   * Najdi zamestnavatela pre aktualneho pouzivatela
   */
  private findEmployer(users: ApiUser[]): void {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Najdi zamestnavatelov v tej istej spolocnosti
    const user = users.find(u => u.id === currentUser.id);
    if (user) {
      const employer = users.find(u => u.companyId === user.companyId && u.role === 1); // 1 = Employer
      if (employer) {
        this.employer = employer;
      }
    }
  }

  /**
   * Otvori email klienta s emailom zamestnavatela
   */
  openEmployerEmail(): void {
    if (this.employer && this.employer.email) {
      window.open(`mailto:${this.employer.email}`, '_blank');
    }
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
