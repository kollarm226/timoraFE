import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  role: string;
  createdAt: string;
  isApproved: boolean;
}

/**
 * Admin Pending Users Component
 * Umoznuje zamestnavatelom zamietnut a akceptovat ziadost o registraciu s danou company ID
 */
@Component({
  selector: 'app-admin-pending-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-pending-users.component.html',
  styleUrls: ['./admin-pending-users.component.css']
})
export class AdminPendingUsersComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  pendingUsers: PendingUser[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isDark = false;
  approvingUserId: number | null = null;
  rejectingUserId: number | null = null;

  ngOnInit(): void {
    this.initializeTheme();
    this.loadPendingUsers();
  }

  /**
   * Inicializacia dark mode z localstorage
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDark = true;
      document.body.classList.add('dark-theme');
    } else {
      this.isDark = false;
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Load cakajucich (pending) userov z backendu
   */
  loadPendingUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.getPendingUsers().subscribe({
      next: (result: unknown[]) => {
        const users = result as PendingUser[];
        this.pendingUsers = users;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load pending users. You may not have permission to view this page.';
        console.error('Error loading pending users:', error);
      }
    });
  }

  /**
   * Prijat pending usera
   */
  approveUser(userId: number): void {
    this.approvingUserId = userId;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.approveUser(userId).subscribe({
      next: () => {
        this.successMessage = 'User approved successfully!';
        this.approvingUserId = null;
        // Odstranit z listu
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error: unknown) => {
        this.approvingUserId = null;
        this.errorMessage = 'Failed to approve user. Please try again.';
        console.error('Error approving user:', error);
      }
    });
  }

  /**
   * Zamietnutie pending usera
   */
  rejectUser(userId: number): void {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return;
    }

    this.rejectingUserId = userId;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.rejectUser(userId).subscribe({
      next: () => {
        this.successMessage = 'User rejected successfully!';
        this.rejectingUserId = null;
        // Odstranit z listu
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error: unknown) => {
        this.rejectingUserId = null;
        this.errorMessage = 'Failed to reject user. Please try again.';
        console.error('Error rejecting user:', error);
      }
    });
  }

  /**
   * Toggle dark theme
   */
  toggleTheme(): void {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  /**
   * Vrati sa na dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Formatovanie datoveho stringu
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  }
}
