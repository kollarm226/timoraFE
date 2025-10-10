import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register/register.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, RegisterComponent],
  templateUrl: './app.component.html'
})
export class AppComponent { 

  title = 'Timora';
  
}