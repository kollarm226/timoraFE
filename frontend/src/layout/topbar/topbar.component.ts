import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

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
}
