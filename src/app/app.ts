import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  title = 'angular-auth-app';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check authentication status and redirect accordingly
    this.supabaseService.user$.subscribe(user => {
      if (user && this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      } else if (!user && !['/auth/login', '/auth/register'].includes(this.router.url)) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
