import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Login komponent - prihlasovaci formular
 * Validuje vstupne data a autentifikuje uzivatela
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  submitted = false;
  serverError: string | null = null;
  loading = false;
  isDark = false;
  showPassword = false;

  constructor() {
    this.initializeTheme();
  }

  /**
   * Prepnutie tmavej temy: prida/odoberie triedu 'dark-theme' na elemente body
   */
  toggleTheme(): void {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  /**
   * Inicializacia temy z localStorage alebo systemovych nastaveni
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDark = true;
      document.body.classList.add('dark-theme');
    } else {
      this.isDark = false;
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Prepnutie viditelnosti hesla
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loginForm: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ]
  });

  get f() {
    return this.loginForm.controls;
  }

  /**
   * Odoslanie prihlasovacieho formulara
   */
  onSubmit(): void {
    this.submitted = true;
    this.serverError = null;

    if (this.loginForm.invalid) {
      return;
    }

    const credentials = {
      username: String(this.f['email'].value).trim(), // Email pouzity ako prihlasovacie meno
      password: String(this.f['password'].value)
    };

    this.loading = true;

    this.auth.login(credentials).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.loading = false;
        const message = (err instanceof Error)
          ? err.message
          : 'Login failed. Please check your credentials.';
        this.serverError = message;
      }
    });
  }

  /** Presmerovanie na registracnu stranku */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /** Reset hesla */
  onResetPassword(): void {
    this.serverError = null;

    const emailControl = this.f['email'];
    if (!emailControl || emailControl.invalid) {
      this.serverError = 'Enter a valid email to reset your password.';
      return;
    }

    const email = String(emailControl.value).trim();
    this.loading = true;

    this.auth.resetPassword(email).subscribe({
      next: () => {
        this.loading = false;
        alert('A reset link has been sent to your email.');
      },
      error: (err: unknown) => {
        this.loading = false;
        const message = (err instanceof Error)
          ? err.message
          : 'Unable to send the password reset.';
        this.serverError = message;
      }
    });
  }
}