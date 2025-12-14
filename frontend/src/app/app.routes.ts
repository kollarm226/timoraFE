import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

/**
 * Routing konfiguracia
 * Definuje vsetky routy v aplikacii
 */
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'announcements', component: AnnouncementsComponent },
  { path: '**', redirectTo: '/login' }  // Fallback na login
];
