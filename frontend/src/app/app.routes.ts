import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { ContactComponent } from './pages/contact/contact.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { AboutComponent } from './pages/about/about.component';
import { FaqComponent } from './pages/faq/faq.component';

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
  { path: 'contact', component: ContactComponent },
  { path: 'documents', component: DocumentsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'faq', component: FaqComponent },
  { path: '**', redirectTo: '/login' }  // Fallback na login
];
