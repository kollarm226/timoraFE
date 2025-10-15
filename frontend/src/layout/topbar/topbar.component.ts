import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  isDark = false;

  toggleTheme() {
    this.isDark = !this.isDark;
    const root = document.body.classList;
    if (this.isDark) {
      root.add('dark-theme');
    } else {
      root.remove('dark-theme');
    }
  }
}
