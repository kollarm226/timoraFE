import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ApiUser, Company } from '../../models/api.models';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

// Rozhranie pre kontakt v komponente
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
  imports: [CommonModule, MatIconModule, MatInputModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  private apiService = inject(ApiService);
  
  allContacts: ContactItem[] = [];
  contacts: ContactItem[] = [];
  companies: Company[] = [];
  loading = true;
  error: string | null = null;
  
  // Filter values
  searchText = '';
  selectedRole = '';
  selectedCompany = '';
  
  // Filter options
  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: '0', label: 'Employee' },
    { value: '1', label: 'Employer' },
    { value: '2', label: 'Admin' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    // Load both users and companies
    forkJoin({
      users: this.apiService.getUsers(),
      companies: this.apiService.getCompanies()
    })
      .pipe(
        catchError(error => {
          console.error('Error loading data:', error);
          this.error = 'Failed to load contacts.';
          return of({ users: [], companies: [] });
        })
      )
      .subscribe(({ users, companies }) => {
        this.companies = companies;
        this.allContacts = users.map(user => this.mapUserToContact(user));
        this.contacts = [...this.allContacts];
        this.loading = false;
        
        // Apply any existing filters
        this.applyFilters();
      });
  }

  // Mapuje API usera na kontakt objekt
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

  // Vrati textovy label pre rolu
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

  // Apply filters to contact list
  private applyFilters(): void {
    if (!this.allContacts.length) return;
    
    this.contacts = this.allContacts.filter(contact => {
      // Filter by search text (name)
      const matchesSearch = !this.searchText || 
        contact.name.toLowerCase().includes(this.searchText.toLowerCase());
      
      // Filter by role
      const matchesRole = !this.selectedRole || 
        contact.roleNumber.toString() === this.selectedRole;
      
      // Filter by company
      const matchesCompany = !this.selectedCompany || 
        contact.companyId.toString() === this.selectedCompany;
      
      return matchesSearch && matchesRole && matchesCompany;
    });
  }

  // Handle filter changes
  onFilterChange(): void {
    this.applyFilters();
  }

  // Clear all filters
  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = '';
    this.selectedCompany = '';
    this.applyFilters();
  }

  // Get company options for select
  get companyOptions() {
    return [
      { value: '', label: 'All Companies' },
      ...this.companies.map(company => ({
        value: company.id.toString(),
        label: company.name
      }))
    ];
  }
}
