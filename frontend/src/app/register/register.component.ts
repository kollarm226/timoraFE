import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Register component - onboarding form for new users
 * Validates all inputs and creates a new account
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  submitted = false;
  serverError: string | null = null;
  loading = false;
  isDark = false;
  showPassword = false;
  showConfirmPassword = false;

  // Toggle between joining an existing company and creating a new one
  registerMode: 'join' | 'create' = 'join';

  constructor() {
    this.initializeTheme();
  }

  /**
   * Toggle dark theme: adds/removes `dark-theme` class on document body
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
   * Initialize theme from localStorage or system preference
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
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Toggle between join (existing) and create (new) company modes
   */
  toggleRegisterMode(): void {
    this.registerMode = this.registerMode === 'join' ? 'create' : 'join';
    this.registerForm.reset();
    this.submitted = false;
  }

  registerForm: FormGroup = this.fb.group({
    companyId: ['', [Validators.minLength(1), Validators.maxLength(10)]],
    companyName: ['', [Validators.minLength(3), Validators.maxLength(100)]],
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.lettersOnlyValidator()
      ]
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.lettersOnlyValidator()
      ]
    ],
    userName: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        this.alphanumericValidator()
      ]
    ],
    email: [
      '',
      [Validators.required, Validators.email]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(64),
        this.passwordStrengthValidator()
      ]
    ],
    confirmPassword: ['', Validators.required]
  }, {
    validators: [
      this.passwordsMatchValidator,
      this.companySelectionValidator()
    ]
  });

  /**
   * Validator - ensures password and confirmation match
   */
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
  }

  /**
   * Validator - allows letters only (diacritics allowed)
   */
  private lettersOnlyValidator(): ValidatorFn {
    const regex = /^[A-Za-zÀ-ž]+(?:[\s'-][A-Za-zÀ-ž]+)*$/u;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { lettersOnly: true };
    };
  }

  /**
   * Validator - allows alphanumeric characters (no diacritics)
   */
  private alphanumericValidator(): ValidatorFn {
    const regex = /^[A-Za-z0-9_-]*$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { alphanumeric: true };
    };
  }

  /**
   * Validator - requires either companyId or companyName to be set
   */
  private companySelectionValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const companyId = group.get('companyId')?.value;
      const companyName = group.get('companyName')?.value;

      // Require at least one field
      if (!companyId && !companyName) {
        return { companyRequired: true };
      }

      // Disallow filling both fields at once
      if (companyId && companyName) {
        return { companyConflict: true };
      }

      return null;
    };
  }

  /**
   * Validator - enforces password strength (upper/lowercase, number, special)
   */
  private passwordStrengthValidator(): ValidatorFn {
    const upper = /[A-Z]/;
    const lower = /[a-z]/;
    const digit = /[0-9]/;
    const special = /[^A-Za-z0-9]/;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      if (!value) return null;

      const hasUpper = upper.test(value);
      const hasLower = lower.test(value);
      const hasDigit = digit.test(value);
      const hasSpecial = special.test(value);

      const isStrong = hasUpper && hasLower && hasDigit && hasSpecial;
      return isStrong ? null : { weakPassword: true };
    };
  }

  get f() {
    return this.registerForm.controls;
  }

  /**
   * Submit registration form
   */
  onSubmit(): void {
    this.submitted = true;
    this.serverError = null;

    if (this.registerForm.invalid) {
      return;
    }

    const registrationData: Record<string, string> = {
      firstName: String(this.f['firstName'].value).trim(),
      lastName: String(this.f['lastName'].value).trim(),
      userName: String(this.f['userName'].value).trim().toLowerCase(),
      email: String(this.f['email'].value).trim().toLowerCase(),
      password: String(this.f['password'].value)
    };

    // Add companyId or companyName based on mode
    if (this.registerMode === 'join') {
      const parsedId = parseInt(String(this.f['companyId'].value).trim(), 10);
      if (isNaN(parsedId)) {
        this.serverError = 'Invalid Company ID format';
        this.loading = false;
        return;
      }
      registrationData['companyId'] = String(parsedId);
    } else {
      registrationData['companyName'] = String(this.f['companyName'].value).trim();
    }

    this.loading = true;

    this.auth.register(registrationData).subscribe({
      next: (response) => {
        this.loading = false;

        console.log('🎉 Registration response:', response);
        console.log('Role from response:', response.user?.role || (response as Record<string, unknown>)['role']);
        
        // Retrieve Company ID from possible response shapes
        const companyId = response.user?.companyId || (response as Record<string, unknown>)['companyId'] || 'N/A';

        alert(`User registered successfully: ${registrationData['firstName']} ${registrationData['lastName']}\n\nYOUR COMPANY ID IS: ${companyId}\n\nPlease save this ID; you will need it to sign in.`);
        this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        this.loading = false;
        console.error('❌ Registration error:', err);
        const message = (err instanceof Error)
          ? err.message
          : 'An error occurred during registration';
        this.serverError = message;
      }
    });
  }

  /** Navigate to login page */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
