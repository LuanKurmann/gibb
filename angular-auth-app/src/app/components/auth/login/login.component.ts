import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    public i18n: I18nService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const { email, password } = this.loginForm.value;
        await this.supabaseService.signIn(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = this.i18n.t('auth.loginError');
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return fieldName === 'email' ? this.i18n.t('auth.invalidEmail') : this.i18n.t('auth.passwordRequired');
      }
      if (field.errors['email']) {
        return this.i18n.t('auth.invalidEmail');
      }
      if (field.errors['minlength']) {
        return this.i18n.t('auth.passwordRequired');
      }
    }
    return '';
  }
}
