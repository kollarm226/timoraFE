import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // root presmeruje na login
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];
