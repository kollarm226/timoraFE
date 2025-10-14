import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // root presmeruje na login
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Dashboard is a standalone component in src/app/pages/dashboard
  { path: 'dashboard', loadComponent: () => import('../app/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) }
];

