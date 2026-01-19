import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { TopbarComponent } from '../layout/topbar/topbar.component';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Timora';
  hideSidebar = false;

  private router = inject(Router);

  constructor() {
    // Inicializacia temy z localStorage AKO PRVA, pred routovanim
    this.initializeTheme();

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.updateSidebarVisibility();
    });
    this.updateSidebarVisibility();
  }

  /**
   * Inicializacia temy z localStorage alebo systemovych nastaveni
   * Volane v konstruktore pre aplikovanie temy pred vykreslenim UI
   */
  private initializeTheme(): void {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    } catch {
      // Ignorovat chyby localStorage (napr. private mode)
    }
  }

  private updateSidebarVisibility(): void {
    const url = this.router.url || '';
    this.hideSidebar = url.startsWith('/register') || url.startsWith('/login') || url === '/';
  }
}