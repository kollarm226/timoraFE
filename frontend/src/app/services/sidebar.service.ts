import { Injectable, signal } from '@angular/core';

/**
 * Servis pre stav sidebaru (bocny panel)
 * Umoznuje otvaranie/zatvaranie z viacerych komponentov
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isOpen = signal(false);

  toggleSidebar(): void {
    this.isOpen.set(!this.isOpen());
  }

  openSidebar(): void {
    this.isOpen.set(true);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }
}
