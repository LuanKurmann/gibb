import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';
import { I18nService, SupportedLanguage } from '../../services/i18n.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: AuthUser | null = null;
  currentLanguage: SupportedLanguage = 'en';
  showLogoutConfirm = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.supabaseService.user$.subscribe(user => {
      this.user = user;
    });
    
    this.i18n.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  changeLanguage(lang: SupportedLanguage) {
    this.i18n.setLanguage(lang);
  }

  confirmLogout() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
