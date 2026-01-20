import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Pending Approval Component
 * Displayed when a user joins a company and is waiting for employer approval
 */
@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approval.component.html',
  styleUrls: ['./pending-approval.component.css']
})
export class PendingApprovalComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  userName = '';
  companyName = '';
  isDark = false;

  ngOnInit(): void {
    this.initializeTheme();

    // Get user data from auth service
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.companyName = user.companyName || 'your company';
      } else {
        // If no user, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Initialize theme from localStorage
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
   * Logout user
   */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
