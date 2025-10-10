import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: '**', redirectTo: '' }
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/register', pathMatch: 'full' }, // root presmeruje na register
  { path: 'register', component: RegisterComponent }
];
