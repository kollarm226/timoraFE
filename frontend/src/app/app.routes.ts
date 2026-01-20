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
import { AdminRequestsComponent } from './pages/admin/admin-requests.component';
import { AdminPendingUsersComponent } from './admin/admin-pending-users/admin-pending-users.component';
import { PendingApprovalComponent } from './pending-approval/pending-approval.component';
import { authGuard } from './guards/auth.guard';

/**
 * Routing konfiguracia
 * Definuje vsetky routy v aplikacii
 */
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'pending-approval', component: PendingApprovalComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'announcements', component: AnnouncementsComponent, canActivate: [authGuard] },
  { path: 'contact', component: ContactComponent, canActivate: [authGuard] },
  { path: 'documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent, canActivate: [authGuard] },
  { path: 'faq', component: FaqComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminRequestsComponent, canActivate: [authGuard] },
  { path: 'admin/pending-users', component: AdminPendingUsersComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }  // Fallback na login
];
