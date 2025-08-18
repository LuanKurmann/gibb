import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    public i18n: I18nService
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  async onSubmit() {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const { username, email, password } = this.registerForm.value;
        await this.supabaseService.signUp(email, password, username);
        this.router.navigate(['/auth/login']);
      } catch (error: any) {
        this.errorMessage = this.i18n.t('auth.registerError');
        console.error('Register error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'username': return this.i18n.t('auth.usernameRequired');
          case 'email': return this.i18n.t('auth.invalidEmail');
          case 'password': return this.i18n.t('auth.passwordRequired');
          case 'confirmPassword': return this.i18n.t('auth.passwordRequired');
          default: return '';
        }
      }
      if (field.errors['email']) {
        return this.i18n.t('auth.invalidEmail');
      }
      if (field.errors['minlength']) {
        return fieldName === 'username' ? this.i18n.t('auth.usernameRequired') : this.i18n.t('auth.passwordRequired');
      }
      if (field.errors['passwordMismatch']) {
        return this.i18n.t('auth.passwordsNotMatch');
      }
    }
    return '';
  }
}
