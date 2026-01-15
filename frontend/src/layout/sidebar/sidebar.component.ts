import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { SidebarService } from '../../app/services/sidebar.service';

/**
 * Sidebar komponent - bocny navigacny panel
 * Zobrazuje menu s odkazmi na jednotlive stranky
 * Responsive: hamburger menu na mobile
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  isOpen = this.sidebarService.isOpen;

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }
}

