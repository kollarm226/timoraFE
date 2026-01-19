import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { SidebarService } from '../../app/services/sidebar.service';

/**
 * Sidebar komponent - bocny navigacny panel
 * Zobrazuje menu s odkazmi na jednotlive stranky
 * Responzivny: hamburger menu na mobile
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
  private router = inject(Router);
  isOpen = this.sidebarService.isOpen;

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  /**
   * Prejde na dashboard po kliknuti na logo
   */
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
    this.closeSidebar();
  }
}

