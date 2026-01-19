import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ApiUser, Company } from '../../models/api.models';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface ContactItem {
  id: number;
  name: string;
  email: string;
  role: string;
  roleNumber: number;
  company: string;
  companyId: number;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  private apiService = inject(ApiService);

  contacts: ContactItem[] = [];
  allContacts: ContactItem[] = [];
  companies: Company[] = [];
  loading = true;
  error: string | null = null;

  // Filtrovacie vlastnosti
  filterText = '';
  filterRole = '';
  filterCompany = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    console.log('Loading users and companies...');

    forkJoin({
      users: this.apiService.getUsers(),
      companies: this.apiService.getCompanies()
    })
      .pipe(
        catchError(error => {
          console.error('Error loading data:', error);
          this.error = 'Failed to load contacts. Please check your connection.';
          return of({ users: [], companies: [] });
        })
      )
      .subscribe({
        next: ({ users, companies }) => {
          console.log('Users loaded:', users);
          console.log('Companies loaded:', companies);

          this.companies = companies;
          this.allContacts = users.map(user => this.mapUserToContact(user));
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Subscribe error:', error);
          this.error = 'Failed to load contacts.';
          this.loading = false;
        }
      });
  }

  private mapUserToContact(user: ApiUser): ContactItem {
    const company = this.companies.find(c => c.id === user.companyId);

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: this.getRoleLabel(user.role),
      roleNumber: user.role ?? 0,
      company: company?.name ?? 'Unknown Company',
      companyId: user.companyId
    };
  }

  private getRoleLabel(roleNumber?: number): string {
    switch (roleNumber) {
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

  applyFilters(): void {
    let filtered = this.allContacts;

    // Filtrovanie podla textu (meno alebo firma)
    if (this.filterText.trim()) {
      const search = this.filterText.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search)
      );
    }

    // Filtrovanie podla role
    if (this.filterRole) {
      filtered = filtered.filter(c => c.role === this.filterRole);
    }

    // Filtrovanie podla firmy
    if (this.filterCompany) {
      filtered = filtered.filter(c => c.company === this.filterCompany);
    }

    // Zoradenie podla role: Prvy Employer (1), potom Employee (0), potom Admin (2)
    filtered = filtered.sort((a, b) => {
      const roleOrder = { 1: 0, 0: 1, 2: 2 }; // Employer=0, Employee=1, Admin=2
      const aOrder = roleOrder[a.roleNumber as keyof typeof roleOrder] ?? 3;
      const bOrder = roleOrder[b.roleNumber as keyof typeof roleOrder] ?? 3;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Ak je rola rovnaka, zoradit abecedne podla mena
      return a.name.localeCompare(b.name);
    });

    this.contacts = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterRole = '';
    this.filterCompany = '';
    this.applyFilters();
  }
}