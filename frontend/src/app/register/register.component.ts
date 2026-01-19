import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Registracny komponent - formular pre novych uzivatelov
 * Validuje vsetky vstupy a vytvara novy ucet
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

  // Prepmanie medzi pripojenim k existujucej firme a vytvorenim novej
  registerMode: 'join' | 'create' = 'join';

  constructor() {
    this.initializeTheme();
  }

  /**
   * Prepnutie temy
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

  /**
   * Prepnutie viditelnosti potvrdzovacieho hesla
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Prepnutie medzi rezimom pripojenia (existujuca) a vytvorenia (nova) firmy
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
   * Validator - zabezpecuje zhodu hesla a potvrdenia hesla
   */
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
  }

  /**
   * Validator - povoluje iba pismena (diakritika povolena)
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
   * Validator - povoluje alfanumericke znaky (bez diakritiky)
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
   * Validator - vyzaduje nastavenie bud companyId alebo companyName
   */
  private companySelectionValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const companyId = group.get('companyId')?.value;
      const companyName = group.get('companyName')?.value;

      // Vyzaduje aspon jedno pole
      if (!companyId && !companyName) {
        return { companyRequired: true };
      }

      // Zakazuje vyplnenie oboch poli naraz
      if (companyId && companyName) {
        return { companyConflict: true };
      }

      return null;
    };
  }

  /**
   * Validator - vynucuje silu hesla (male/velke pismena, cislo, specialny znak)
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
   * Odoslanie registracneho formulara
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

    // Pridat companyId alebo companyName podla rezimu
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

        alert(`User registered successfully: ${registrationData['firstName']} ${registrationData['lastName']}`);
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

  /** Prechod na prihlasovaciu stranku */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
