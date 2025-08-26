import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'auth/login', 
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'auth/register', 
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'bm-grades', 
    loadComponent: () => import('./components/bm-grades/bm-grades.component').then(m => m.BMGradesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'bm-grades/subject/:id', 
    loadComponent: () => import('./components/subject-detail/subject-detail.component').then(m => m.SubjectDetailComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'test-calendar', 
    loadComponent: () => import('./components/test-calendar/test-calendar.component').then(m => m.TestCalendarComponent),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
