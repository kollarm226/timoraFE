import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HolidayRequest, ApiUser, Company } from '../../models/api.models';
import { Router } from '@angular/router';

interface RequestView extends HolidayRequest {
  userName: string;
  companyName: string;
  days: number;
}

interface UserView extends ApiUser {
  companyName: string;
}

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-requests.component.html',
  styleUrls: ['./admin-requests.component.css']
})
export class AdminRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  activeTab: 'vacations' | 'users' = 'vacations';
  requests: RequestView[] = [];
  allRequests: RequestView[] = [];
  users: UserView[] = [];
  allUsers: UserView[] = [];
  loading = true;
  error: string | null = null;
  actionLoading: Record<number, boolean> = {};
  filterText = '';
  filterStatus: string | null = null;
  userFilterText = '';
  openMenuId: number | null = null;
  userActionLoading: Record<number, boolean> = {};
  menuPosition: { top: string; left: string } = { top: '0px', left: '0px' };

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    const role = user?.role ?? 0;
    if (role !== 1 && role !== 2) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadData();
  }

  /**
   * Kontroluje ci je aktualny uzivatel Admin (rola 2)
   */
  isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return user?.role === 2;
  }

  /**
   * Kontroluje ci moze uzivatel spravovat userov (Employer alebo Admin)
   */
  canManageUsers(): boolean {
    const user = this.auth.getCurrentUser();
    return user?.role === 1 || user?.role === 2;
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      requests: this.api.getHolidayRequests(),
      users: this.api.getUsers(),
      companies: this.api.getCompanies()
    }).subscribe({
      next: ({ requests, users, companies }) => {
        const usersMap = new Map<number, ApiUser>();
        users.forEach(u => usersMap.set(u.id, u));

        const companiesMap = new Map<number, Company>();
        companies.forEach(c => companiesMap.set(c.id, c));

        const requestViews = requests.map(r => {
          const user = usersMap.get(r.userId);
          const company = user ? companiesMap.get(user.companyId) : undefined;
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          // Zobraz meno uzivatela alebo indikuj ze bol zmazany
          let userName: string;
          if (user) {
            userName = `${user.firstName} ${user.lastName}`;
          } else {
            userName = `User #${r.userId} (deleted)`;
          }

          return {
            ...r,
            userName,
            companyName: company ? company.name : `Company #${user?.companyId ?? 'N/A'}`,
            days
          };
        });

        const userViews = users.map(u => {
          const company = companiesMap.get(u.companyId);
          return {
            ...u,
            companyName: company ? company.name : `Company #${u.companyId}`
          };
        });

        this.allRequests = requestViews;
        this.allUsers = userViews;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load admin data', err);
        this.error = err?.error?.message || 'Failed to load requests';
        this.loading = false;
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  statusLabel(status: HolidayRequest['status']): string {
    if (status === undefined || status === null) return 'Pending';
    const val = typeof status === 'number' ? status : status.toString().toLowerCase();
    if (val === 0 || val === 'pending') return 'Pending';
    if (val === 1 || val === 'approved') return 'Approved';
    if (val === 2 || val === 'denied' || val === 'rejected') return 'Denied';
    if (val === 3 || val === 'cancelled' || val === 'canceled') return 'Cancelled';
    return 'Pending';
  }

  statusClass(status: HolidayRequest['status']): string {
    if (status === undefined || status === null) return 'status pending';
    const val = typeof status === 'number' ? status : status.toString().toLowerCase();
    if (val === 1 || val === 'approved') return 'status approved';
    if (val === 2 || val === 'denied' || val === 'rejected') return 'status denied';
    if (val === 3 || val === 'cancelled' || val === 'canceled') return 'status cancelled';
    return 'status pending';
  }

  canResolve(status: HolidayRequest['status']): boolean {
    if (status === undefined || status === null) return true; // undefined status = pending = can resolve
    const val = typeof status === 'number' ? status : status.toString().toLowerCase();
    return val === 0 || val === 'pending';
  }

  applyFilters(): void {
    const currentUser = this.auth.getCurrentUser();
    const currentUserCompanyId = currentUser?.companyId;
    const isEmployer = currentUser?.role === 1; // Employer má rolu 1
    const isAdmin = currentUser?.role === 2; // Admin má rolu 2

    // Aplikovat filtrovanie dovoleniek
    let filtered = this.allRequests;

    // Vzdy odfiltrovat dovolenky zmazanych uzivatelov
    filtered = filtered.filter(r => !r.userName.includes('(deleted)'));

    // KRITICKE: Employer vidi len ziadosti zo svojej firmy, Admin vidi vsetky
    if (isEmployer && !isAdmin && currentUserCompanyId) {
      const companyId = typeof currentUserCompanyId === 'string' ? parseInt(currentUserCompanyId) : currentUserCompanyId;
      filtered = filtered.filter(r => {
        // Najst uzivatela pre tuto ziadost a skontrolovat jeho companyId
        const user = this.allUsers.find(u => u.id === r.userId);
        return user && user.companyId === companyId;
      });
    }

    if (this.filterText.trim()) {
      const search = this.filterText.toLowerCase();
      filtered = filtered.filter(r =>
        r.userName.toLowerCase().includes(search) ||
        r.companyName.toLowerCase().includes(search) ||
        r.reason?.toLowerCase().includes(search)
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(r => this.statusLabel(r.status) === this.filterStatus);
    }

    this.requests = filtered;

    // Aplikovat filtrovanie uzivatelov
    let filteredUsers = this.allUsers;

    // KRITICKE: Employer vidi len uzivatelov zo svojej firmy, Admin vidi vsetkych
    if (isEmployer && !isAdmin && currentUserCompanyId) {
      const companyId = typeof currentUserCompanyId === 'string' ? parseInt(currentUserCompanyId) : currentUserCompanyId;
      filteredUsers = filteredUsers.filter(u => u.companyId === companyId);
    }

    if (this.userFilterText.trim()) {
      const search = this.userFilterText.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
        u.companyName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    this.users = filteredUsers;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = null;
    this.applyFilters();
  }

  clearUserFilters(): void {
    this.userFilterText = '';
    this.applyFilters();
  }

  setActiveTab(tab: 'vacations' | 'users'): void {
    // Zabranit pristupu uzivatelom bez manazerskych opravneni na kartu Uzivatelia
    if (tab === 'users' && !this.canManageUsers()) {
      console.warn('Access denied: Users tab is only available for Employer and Admin users');
      return;
    }

    this.activeTab = tab;
  }

  toggleUserMenu(userId: number): void {
    this.openMenuId = this.openMenuId === userId ? null : userId;
    if (this.openMenuId === userId) {
      setTimeout(() => {
        const button = document.querySelector(`[data-user-id="${userId}"]`) as HTMLElement;
        if (button) {
          const rect = button.getBoundingClientRect();
          this.menuPosition = {
            top: (rect.bottom + 8) + 'px',
            left: (rect.left - 160 + 32) + 'px'
          };
        }
      }, 0);
    }
  }

  closeUserMenu(): void {
    this.openMenuId = null;
  }

  deleteUser(user: UserView): void {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      return;
    }

    if (this.userActionLoading[user.id]) return;
    this.userActionLoading[user.id] = true;

    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter(u => u.id !== user.id);
        this.applyFilters();
        this.closeUserMenu();
        this.userActionLoading[user.id] = false;
      },
      error: (err) => {
        console.error('Failed to delete user', err);
        this.error = err?.error?.message || 'Failed to delete user';
        this.userActionLoading[user.id] = false;
      }
    });
  }

  updateStatus(request: HolidayRequest, status: 1 | 2 | 3, comment?: string): void {
    if (this.actionLoading[request.id]) return;
    this.actionLoading[request.id] = true;

    const resolverUser = this.auth.getCurrentUser();
    const resolvedByUserId = resolverUser?.id ?? undefined;

    this.api.updateHolidayRequestStatus(request.id, {
      status,
      resolvedByUserId,
      resolverComment: comment ?? ''
    }).subscribe({
      next: (updated) => {
        this.requests = this.requests.map(r => r.id === request.id ? { ...r, ...updated } as RequestView : r);
        this.actionLoading[request.id] = false;
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.actionLoading[request.id] = false;
        this.error = err?.error?.message || 'Failed to update status';
      }
    });
  }
}
