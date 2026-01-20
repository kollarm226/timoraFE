import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgForOf, NgIf, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Notice, CreateNoticeRequest } from '../../models/api.models';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Rozhranie pre oznamenie v komponente
interface Announcement {
  id: number;
  userId: number;
  author: string;
  title: string;
  preview: string;
  body: string;
  createdAt: Date;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    NgForOf,
    NgIf,
    DatePipe,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.css'
})
export class AnnouncementsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  selected: Announcement | null = null;
  latest: Announcement | null = null;
  all: Announcement[] = [];
  loading = true;
  error: string | null = null;
  canCreate = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.canCreate = user ? (user.role || 0) >= 1 : false;
    });
    this.loadNotices();
  }

  loadNotices(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getNotices()
      .pipe(
        catchError(error => {
          console.error('Error loading notices:', error);
          this.error = 'Failed to load announcements.';
          return of([]);
        })
      )
      .subscribe(notices => {
        this.all = notices.map(this.mapNoticeToAnnouncement);
        this.latest = this.all.length > 0 ? { ...this.all[0] } : null;
        this.loading = false;
      });
  }

  // Mapuje notice z API na announcement objekt
  private mapNoticeToAnnouncement(notice: Notice): Announcement {
    const authorName = notice.user
      ? `${notice.user.firstName} ${notice.user.lastName}`
      : 'Unknown author';

    const preview = notice.content.length > 150
      ? notice.content.substring(0, 150) + '...'
      : notice.content;

    return {
      id: notice.id,
      userId: notice.userId,
      author: authorName,
      title: notice.title,
      preview: preview,
      body: notice.content,
      createdAt: new Date(notice.createdAt)
    };
  }

  // Kontroluje ci je oznamenie neprecitane
  isNoticeUnread(noticeId: number): boolean {
    const readNotices = this.getReadNotices();
    return !readNotices.includes(noticeId);
  }

  // Oznaci oznamenie ako precitane
  markNoticeAsRead(noticeId: number): void {
    const readNotices = this.getReadNotices();
    if (!readNotices.includes(noticeId)) {
      readNotices.push(noticeId);
      localStorage.setItem('readNotices', JSON.stringify(readNotices));
    }
  }

  // Ziska zoznam precitanych oznameni z localStorage
  private getReadNotices(): number[] {
    const stored = localStorage.getItem('readNotices');
    return stored ? JSON.parse(stored) : [];
  }

  openCreateDialog(): void {
    if (!this.canCreate) {
      this.error = 'Only employers can create announcements.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'You must be logged in to create an announcement.';
      return;
    }

    const dialogRef = this.dialog.open(CreateNoticeDialogComponent, {
      width: '500px',
      data: { userId: currentUser.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadNotices(); // Znovu nacita oznamenia po vytvoreni noveho
      }
    });
  }

  select(announcement: Announcement): void {
    // Oznaci oznamenie ako precitane pri otvoreni
    this.markNoticeAsRead(announcement.id);
    this.selected = announcement;
  }

  close(): void {
    this.selected = null;
  }
}

// Dialog komponent pre vytvaranie oznameni
@Component({
  selector: 'app-create-notice-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf  // Prida NgIf pre *ngIf direktivy
  ],
  template: `
    <h2 mat-dialog-title>Create New Announcement</h2>
    <form [formGroup]="noticeForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Enter announcement title" maxlength="200">
          <mat-error *ngIf="noticeForm.get('title')?.hasError('required')">
            Title is required
          </mat-error>
          <mat-error *ngIf="noticeForm.get('title')?.hasError('maxlength')">
            Title can have maximum 200 characters
          </mat-error>
        </mat-form-field>
        
        <mat-form-field class="full-width">
          <mat-label>Content</mat-label>
          <textarea 
            matInput 
            formControlName="content" 
            placeholder="Enter announcement content"
            rows="6"
            maxlength="2000">
          </textarea>
          <mat-error *ngIf="noticeForm.get('content')?.hasError('required')">
            Content is required
          </mat-error>
          <mat-error *ngIf="noticeForm.get('content')?.hasError('maxlength')">
            Content can have maximum 2000 characters
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit"
          [disabled]="noticeForm.invalid || isSubmitting">
          {{isSubmitting ? 'Creating...' : 'Create'}}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class CreateNoticeDialogComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<CreateNoticeDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as { userId: number };

  noticeForm: FormGroup;
  isSubmitting = false;
  userId: number;

  constructor() {
    this.userId = this.data.userId;
    this.noticeForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  onSubmit(): void {
    if (this.noticeForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const createRequest: CreateNoticeRequest = {
        userId: this.userId,
        title: this.noticeForm.value.title,
        content: this.noticeForm.value.content
      };

      this.apiService.createNotice(createRequest)
        .pipe(
          catchError(error => {
            console.error('Error creating notice:', error);
            this.isSubmitting = false;
            return of(null);
          })
        )
        .subscribe(result => {
          this.isSubmitting = false;
          if (result) {
            this.dialogRef.close(true);
          }
        });
    }
  }
}
