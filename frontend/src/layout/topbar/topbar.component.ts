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
import { ApiService } from '../../app/services/api.service';
import { Company } from '../../app/models/api.models';

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
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  isDark = false;
  displayName = 'User';
  role = '';
  roleId: number | undefined;
  showMenu = false;
  companyName = '';
  companyId: string | number | undefined;
  companies: Company[] = [];

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
    // Load companies first
    this.api.getCompanies().pipe(takeUntil(this.destroy$)).subscribe({
      next: (companies) => {
        this.companies = companies;
        // Update company name if user is already loaded
        this.updateCompanyName();
      },
      error: (err) => {
        console.warn('Failed to load companies for topbar:', err);
      }
    });

    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
          this.displayName = fullName || user.email || 'User';
          this.role = this.getRoleText(user.role);
          this.roleId = user.role;
          this.companyId = user.companyId;
          
          // Update company name
          this.updateCompanyName();
        } else {
          this.displayName = 'Guest';
          this.role = '';
          this.roleId = undefined;
          this.companyName = '';
          this.companyId = undefined;
        }
      });
  }

  logout(): void {
    console.log('🔄 Starting logout...');
    this.showMenu = false;
    
    this.auth.logout().subscribe({
      next: () => {
        console.log('✅ Logout OK, navigating to /login');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log('❌ Logout error but still navigating:', err);
        this.router.navigate(['/login']);
      }
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

  private updateCompanyName(): void {
    if (this.companyId && this.companies.length > 0) {
      const companyIdNum = typeof this.companyId === 'string' ? parseInt(this.companyId) : this.companyId;
      const company = this.companies.find(c => c.id === companyIdNum);
      this.companyName = company ? company.name : `Company #${this.companyId}`;
    } else if (this.companyId) {
      this.companyName = `Company #${this.companyId}`;
    } else {
      this.companyName = '';
    }
  }

  get canSeeAdmin(): boolean {
    return this.roleId === 1 || this.roleId === 2;
  }
}

