import { Injectable, signal } from '@angular/core';

/**
 * Service na správu stavu sidebaru
 * Umožňuje otvorenie/zatvorenie z rôznych komponentov
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
