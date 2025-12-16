import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  documents = [
    { title: 'Summer Newsletter', description: 'This is a overview from this summer.' },
    { title: 'Updated Policy - November 25', description: 'This is updated policy about sales.' },
    { title: 'Company Magasine - November 25', description: 'This is new company magasine for month November.' },
    { title: 'Annual Report', description: 'This is the annual report.' },
    { title: 'Company Magasine - October 25', description: 'This is new company magasine for month October.' },
    { title: 'Employee Handbook', description: 'This is the basic employee handbook.' },
    { title: 'New Payroll policy', description: 'This is the new payroll policy.' },
    { title: 'Company Magasine - September 25', description: 'This is company magasine for month September.' }
  ];
}
