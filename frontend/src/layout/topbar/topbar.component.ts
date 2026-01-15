import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SidebarService } from '../../app/services/sidebar.service';
import { AuthService } from '../../app/services/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Topbar komponent - horny navigacny panel
 * Obsahuje logo a toggle pre dark mode
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isDark = false;
  displayName = 'User';
  role = '';
  roleId: number | undefined;
  showMenu = false;

  /**
   * Prepne temu medzi svetlou a tmavou
   * Pridava/odobera triedu 'dark-theme' na body elemente
   */
  toggleTheme(): void {
    this.isDark = !this.isDark;
    
    if (this.isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Prepne sidebar
   */
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
          this.displayName = fullName || user.email || 'User';
          this.role = this.getRoleText(user.role);
          this.roleId = user.role;
        } else {
          this.displayName = 'Guest';
          this.role = '';
          this.roleId = undefined;
        }
      });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  toggleUserMenu(): void {
    this.showMenu = !this.showMenu;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getRoleText(role?: number): string {
    switch (role) {
      case 0:
        return 'Employee';
      case 1:
        return 'Employer';
      case 2:
        return 'Admin';
      default:
        return 'Employee';
    }
  }

  get canSeeAdmin(): boolean {
    return this.roleId === 1 || this.roleId === 2;
  }
}

