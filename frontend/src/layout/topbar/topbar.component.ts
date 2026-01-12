import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SidebarService } from '../../app/services/sidebar.service';

/**
 * Topbar komponent - horny navigacny panel
 * Obsahuje logo a toggle pre dark mode
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  private sidebarService = inject(SidebarService);
  isDark = false;

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
}

