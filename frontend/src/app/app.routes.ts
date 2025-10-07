import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/register', pathMatch: 'full' }, // root presmeruje na register
  { path: 'register', component: RegisterComponent }
];
