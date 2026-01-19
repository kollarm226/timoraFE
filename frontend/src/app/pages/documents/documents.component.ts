import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Document } from '../../models/api.models';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../models/user.model';

/**
 * Documents komponent - zobrazenie a sprava dokumentov
 * Employer moze pridavat dokumenty cez externy link (napr. nahrajsoubor.cz)
 */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, DatePipe],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  documents: Document[] = [];
  loading = true;
  error: string | null = null;
  currentUser: User | null = null;
  isEmployer = false;

  ngOnInit(): void {
    // Subscribe na aktualneho pouzivatela z AuthService
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isEmployer = user?.role === 1;

        // Nacitaj dokumenty len ak mame pouzivatela
        if (user && user.companyId) {
          this.loadDocuments();
        } else if (!user) {
          this.error = 'Please log in to view documents';
          this.loading = false;
        } else if (!user.companyId) {
          this.error = 'No company assigned to your account';
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Nacita dokumenty pre firmu aktualneho pouzivatela
   */
  private loadDocuments(): void {
    this.loading = true;
    this.error = null;

    const companyId = this.currentUser?.companyId;
    if (!companyId) {
      this.error = 'No company ID found';
      this.loading = false;
      return;
    }

    this.apiService.getDocuments().subscribe({
      next: (docs: Document[]) => {
        this.documents = docs;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading documents:', err);
        this.error = 'Failed to load documents';
        this.loading = false;
      }
    });
  }

  /**
   * Otvori dialog pre pridanie noveho dokumentu
   */
  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadDocumentDialogComponent, {
      width: '500px',
      data: {
        userId: this.currentUser?.id,
        companyId: this.currentUser?.companyId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDocuments();
      }
    });
  }

  /**
   * Stiahne dokument z externeho linku
   */
  downloadDocument(doc: Document): void {
    window.open(doc.fileUrl, '_blank');
  }

  /**
   * Vymaze dokument (len pre employera)
   */
  deleteDocument(doc: Document): void {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    this.apiService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Error deleting document:', err);
        alert('Failed to delete document');
      }
    });
  }
}

/**
 * Dialog komponent pre upload dokumentu
 */
@Component({
  selector: 'app-upload-document-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Upload Document</h2>
    <mat-dialog-content class="dialog-content-center">
      <p class="info-text">Upload your file (for example) <a href="https://nahrajsoubor.cz" target="_blank">nahrajsoubor.cz</a> and paste the link here</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Document Title</mat-label>
        <input matInput [(ngModel)]="title" placeholder="e.g. Summer Newsletter" required>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optional)</mat-label>
        <textarea matInput [(ngModel)]="description" placeholder="Brief description of the document" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>File URL</mat-label>
        <input matInput [(ngModel)]="fileUrl" placeholder="https://nahrajsoubor.cz/..." required>
        <mat-hint>Paste the download link from nahrajsoubor.cz</mat-hint>
      </mat-form-field>
      <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="upload()" [disabled]="isUploading || !title || !fileUrl">
        {{ isUploading ? 'Uploading...' : 'Upload' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 0 0 0;
    }
    .full-width {
      width: 100%;
      max-width: 400px;
      margin-bottom: 16px;
      display: block;
    }
    .info-text {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 20px;
      text-align: center;
    }
    .info-text a {
      color: var(--primary);
      text-decoration: none;
    }
    .info-text a:hover {
      text-decoration: underline;
    }
    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 8px;
      text-align: center;
    }
    mat-dialog-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 12px;
    }
    h2[mat-dialog-title] {
      text-align: center;
      width: 100%;
      margin-bottom: 8px;
    }
  `]
})
export class UploadDocumentDialogComponent {
  title = '';
  description = '';
  fileUrl = '';
  isUploading = false;
  errorMessage = '';

  private apiService = inject(ApiService);
  private dialogRef = inject(MatDialogRef<UploadDocumentDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { userId: number; companyId: number };
  userId: number = this.data.userId;
  companyId: number = this.data.companyId;

  cancel(): void {
    this.dialogRef.close();
  }

  upload(): void {
    if (!this.title || !this.fileUrl) {
      this.errorMessage = 'Title and File URL are required';
      return;
    }
    this.isUploading = true;
    const documentData = {
      title: this.title,
      description: this.description,
      fileUrl: this.fileUrl,
      uploadedBy: this.userId,
      companyId: this.companyId
    };
    this.apiService.createDocument(documentData).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        console.error('Error uploading document:', err);
        this.errorMessage = 'Failed to upload document. Please try again.';
        this.isUploading = false;
      }
    });
  }
}
