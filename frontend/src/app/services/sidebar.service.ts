import { Injectable, signal } from '@angular/core';

/**
 * Sidebar state service
 * Allows opening/closing from multiple components
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
