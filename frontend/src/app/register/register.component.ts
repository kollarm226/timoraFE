import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Register komponent - registracny formular pre novych uzivatelov
 * Validuje vsetky vstupne polia a vytvara novy ucet
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

  /**
   * Toggle dark theme: adds/removes `dark-theme` class on document body
   */
  toggleTheme(): void {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  registerForm: FormGroup = this.fb.group({
    companyId: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(10),
        this.alphanumericValidator()
      ]
    ],
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
    email: [
      '',
      [Validators.required, Validators.email]
    ],
    address: [
      '',
      [
        Validators.required, 
        Validators.minLength(5), 
        Validators.maxLength(100), 
        this.addressValidator()
      ]
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
  }, { validators: this.passwordsMatchValidator });

  /**
   * Validator - kontrola zhody hesla a potvrdenia hesla
   */
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
  }

  /**
   * Validator - povoli len pismena (vratane diakritiky)
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
   * Validator - povoli len alfanumericke znaky (bez diakritiky)
   */
  private alphanumericValidator(): ValidatorFn {
    const regex = /^[A-Za-z0-9]+$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { alphanumeric: true };
    };
  }

  /**
   * Validator - format adresy (pismena, cisla, zakladne interpunkcie)
   */
  private addressValidator(): ValidatorFn {
    const regex = /^[A-Za-zÀ-ž0-9\s.,/-]{5,100}$/u;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { addressFormat: true };
    };
  }

  /**
   * Validator - sila hesla (velke/male pismena, cislo, specialny znak)
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

    const user: User = {
      companyId: String(this.f['companyId'].value).trim(),
      firstName: String(this.f['firstName'].value).trim(),
      lastName: String(this.f['lastName'].value).trim(),
      email: String(this.f['email'].value).trim().toLowerCase(),
      address: String(this.f['address'].value).trim(),
      password: String(this.f['password'].value)
    };

    this.loading = true;

    this.auth.register(user).subscribe({
      next: () => {
        this.loading = false;
        alert('Uspesne registrovany uzivatel: ' + user.firstName + ' ' + user.lastName);
        this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        this.loading = false;
        const message = (err instanceof Error) 
          ? err.message 
          : 'Nastala chyba pocas registracie';
        this.serverError = message;
      }
    });
  }
}
