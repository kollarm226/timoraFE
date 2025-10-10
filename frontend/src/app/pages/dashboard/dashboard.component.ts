import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  imports: [MatTableModule, MatChipsModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  displayedColumns = ['start', 'end', 'status'];
  vacations = [
    { start: 'December 8.', end: 'December 20.', status: 'Approved' },
    { start: 'February 25.', end: 'February 28.', status: 'Declined' },
    { start: 'April 3.', end: 'April 7.', status: 'Pending' },
  ];
}
