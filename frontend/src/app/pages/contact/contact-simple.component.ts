import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { ApiUser } from '../../models/api.models';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Rozhranie pre kontakt v komponente
interface ContactItem {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page contact-page">
      <h1>Contact</h1>

      <!-- Error message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
        <button type="button" (click)="loadUsers()">Try again</button>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading">
        Loading contacts...
      </div>

      <!-- Contact list -->
      <div *ngIf="!loading && !error" class="contact-list">
        <div class="contact-item" *ngFor="let c of contacts">
          <div class="contact-left">
            <div class="avatar"></div>
            <div class="text">
              <div class="name">{{ c.name }}</div>
              <div class="role">{{ c.role }}</div>
            </div>
          </div>
          <a 
            [href]="'mailto:' + c.email + '?subject=Message from Timora&body=Hello ' + c.name + ',%0D%0A%0D%0A'"
            class="send-btn" 
            [title]="'Send email to ' + c.name"
          >
            <mat-icon fontIcon="send"></mat-icon>
          </a>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !error && contacts.length === 0" class="empty-state">
        <mat-icon>people</mat-icon>
        <p>No contacts found.</p>
      </div>
    </div>
  `,
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  private apiService = inject(ApiService);
  
  contacts: ContactItem[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Loading users...');

    this.apiService.getUsers()
      .pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          this.error = 'Failed to load contacts. Please check your connection.';
          return of([]);
        })
      )
      .subscribe({
        next: (users) => {
          console.log('Users loaded:', users);
          this.contacts = users.map(user => this.mapUserToContact(user));
          this.loading = false;
        },
        error: (error) => {
          console.error('Subscribe error:', error);
          this.error = 'Failed to load contacts.';
          this.loading = false;
        }
      });
  }

  // Mapuje API usera na kontakt objekt
  private mapUserToContact(user: ApiUser): ContactItem {
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: this.getRoleLabel(user.role)
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
}