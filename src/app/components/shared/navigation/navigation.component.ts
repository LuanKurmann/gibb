import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { I18nService } from '../../../services/i18n.service';

interface User {
  id: string;
  email: string;
  username?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl font-semibold text-gray-900">{{ i18n.t('app.title') }}</h1>
            <nav class="flex space-x-8">
              <a 
                routerLink="/dashboard"
                routerLinkActive="border-primary-500 text-primary-600"
                [routerLinkActiveOptions]="{exact: true}"
                class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                {{ i18n.t('navigation.dashboard') }}
              </a>
              <a 
                routerLink="/bm-grades"
                routerLinkActive="border-primary-500 text-primary-600"
                class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                {{ i18n.t('navigation.bmGrades') }}
              </a>
            </nav>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">{{ i18n.t('app.welcome') }}, {{ user?.username || user?.email }}</span>
            <a routerLink="/settings" class="text-primary-600 hover:text-primary-500 text-sm font-medium">
              {{ i18n.t('settings.title') }}
            </a>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavigationComponent {
  user: User | null = null;

  constructor(
    private supabaseService: SupabaseService,
    public i18n: I18nService
  ) {
    this.supabaseService.user$.subscribe(user => {
      this.user = user;
    });
  }
}
