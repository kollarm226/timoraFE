import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { HolidayRequest, Notice, ApiUser, Document as ApiDocument } from '../../models/api.models';
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
  imports: [CommonModule, MatTableModule, MatChipsModule, MatCardModule, MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private destroy$ = new Subject<void>();

  vacations: HolidayRequest[] = [];
  private allVacations: HolidayRequest[] = [];
  private currentUser: User | null = null;
  notices: Notice[] = [];
  allNotices: Notice[] = [];
  latestDocument: ApiDocument | null = null;
  employer: ApiUser | null = null;
  loading = true;
  error: string | null = null;
  noticesLimit = 4;
  vacationsLimit = 4;
  showAllNotices = false;
  showAllVacations = false;
  cancelingId: number | null = null;
  cancelError: string | null = null;

  get displayedColumns(): string[] {
    const hasPendingVacations = this.getDisplayedVacations().some(v =>
      v.status === 0 || v.status === 'Pending' || this.getStatusView(v.status).class === 'pending'
    );
    return hasPendingVacations ? ['start', 'end', 'status', 'actions'] : ['start', 'end', 'status'];
  }

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        // Ak mame uzivatela bez id, skus obohatit z backendu cez email
        if (user && !user.id && user.email) {
          this.apiService.getUserByEmail(user.email).subscribe({
            next: apiUser => {
              this.currentUser = { ...user, id: apiUser.id, role: apiUser.role ?? user.role };
              this.filterVacations();
            },
            error: () => {
              // Tichy fallback; pokracuj s filtrom co sa da
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

    // Obnov dashboard data kazdych 30 sekund aby sa zobrazili nove dovolenky
    const refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);

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
      users: this.apiService.getUsers(),
      documents: this.apiService.getDocuments()
    }).subscribe({
      next: ({ holidayRequests, notices, users, documents }) => {
        // Dovolenky
        this.allVacations = holidayRequests;
        this.filterVacations();

        // Oznamenia
        this.allNotices = notices;
        this.updateNoticesDisplay();

        // Dokumenty
        if (documents && documents.length > 0) {
          // Zoradit podla createdAt zostupne (vytvor kopiu aby sa nemenilo povodne pole)
          this.latestDocument = [...documents].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        } else {
          this.latestDocument = null;
        }

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

    if (userId) {
      this.vacations = this.allVacations
        .filter(v => v.userId === userId || String(v.userId) === String(userId))
        .sort((a, b) => b.id - a.id); // Zorad od najnovsich po najstarsie
      return;
    }

     // Fallback: ak chyba user ID, ponechaj zoznam prazdny kvoli ochrane sukromia
    this.vacations = [];
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
   * Skrati text oznamenia na maximalny pocet znakov
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
    // Naviguj na stranku oznameni alebo zobraz detail v modali
  }

  /**
   * Najdi zamestnavatela pre aktualneho pouzivatela
   */
  findEmployer(users: User[]): void {
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

  /**
   * Stiahnutie dokumentu
   */
  downloadDocument(doc: ApiDocument): void {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
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

    // Extrakt spravu pre uzivatela z chyby
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

  /**
   * Zrusi (vymaze) ziadost o dovolenku
   */
  cancelVacation(vacation: HolidayRequest): void {
    const message = `Are you sure you want to cancel this vacation request (${this.formatDate(vacation.startDate)} - ${this.formatDate(vacation.endDate)})?`;
    if (confirm(message)) {
      this.cancelingId = vacation.id;
      this.cancelError = null;

      // Nastav status na Cancelled (3)
      this.apiService.updateHolidayRequestStatus(vacation.id, { status: 3 }).subscribe({
        next: () => {
          console.log('Vacation cancelled successfully');
          this.cancelingId = null;
          // Obnov data
          this.loadDashboardData();
        },
        error: () => {
          console.error('Error cancelling vacation:', err);
          this.cancelError = 'Failed to cancel vacation request. Please try again.';
          this.cancelingId = null;
        }
      });
    }
  }

  /**
   * Kontroluje ci je holiday request pending a moze sa zrusit
   */
  canCancelVacation(vacation: HolidayRequest): boolean {
    // Status moze byt string alebo number
    const statusStr = String(vacation.status).toLowerCase();
    const statusNum = typeof vacation.status === 'number' ? vacation.status : parseInt(vacation.status as string);

    // Pending moze byt reprezentovane ako: 0, "0", "Pending", "pending"
    return statusNum === 0 || statusStr === 'pending' || vacation.status === 'Pending';
  }

  /**
   * Aktualizuje zobrazenie notices na zaklade nastavenia
   */
  private updateNoticesDisplay(): void {
    this.notices = this.showAllNotices ? this.allNotices : this.allNotices.slice(0, this.noticesLimit);
  }

  /**
   * Prepina zobrazenie vsetkych notices
   */
  toggleAllNotices(): void {
    this.showAllNotices = !this.showAllNotices;
    this.updateNoticesDisplay();
  }

  /**
   * Toggles zobrazenie vsetkych vacation records
   */
  toggleAllVacations(): void {
    this.showAllVacations = !this.showAllVacations;
  }

  /**
   * Vracia vacation records na zobrazenie
   */
  getDisplayedVacations(): HolidayRequest[] {
    return this.showAllVacations ? this.vacations : this.vacations.slice(0, this.vacationsLimit);
  }
}
