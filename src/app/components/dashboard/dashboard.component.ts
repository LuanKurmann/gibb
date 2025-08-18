import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: AuthUser | null = null;

  constructor(
    private supabaseService: SupabaseService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.supabaseService.user$.subscribe(user => {
      this.user = user;
    });
  }
}
