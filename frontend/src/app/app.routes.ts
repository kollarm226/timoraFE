import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // root presmeruje na login
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'announcements', component: AnnouncementsComponent },
  { path: '**', redirectTo: '/register' }
];
