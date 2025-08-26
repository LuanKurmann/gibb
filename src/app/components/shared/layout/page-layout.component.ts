import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../navigation/navigation.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <app-navigation></app-navigation>
      
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Page Header -->
          <div class="mb-8" *ngIf="title">
            <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
            <p class="mt-2 text-sm text-gray-600" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
          
          <!-- Page Content -->
          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `
})
export class PageLayoutComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
}
