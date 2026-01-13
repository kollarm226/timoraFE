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

  // Toggle medzi join company a create company
  registerMode: 'join' | 'create' = 'join';

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

  /**
   * Toggle medzi join (existujuca) a create (nova) company
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
    const regex = /^[A-Za-z0-9_-]*$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { alphanumeric: true };
    };
  }

  /**
   * Validator - musí byť vybraná buď company alebo companyName
   */
  private companySelectionValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const companyId = group.get('companyId')?.value;
      const companyName = group.get('companyName')?.value;

      // Aspoň jeden musí byť vyplnený
      if (!companyId && !companyName) {
        return { companyRequired: true };
      }

      // Oba nesmú byť vyplnené zároveň
      if (companyId && companyName) {
        return { companyConflict: true };
      }

      return null;
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

    const registrationData: any = {
      firstName: String(this.f['firstName'].value).trim(),
      lastName: String(this.f['lastName'].value).trim(),
      userName: String(this.f['userName'].value).trim().toLowerCase(),
      email: String(this.f['email'].value).trim().toLowerCase(),
      password: String(this.f['password'].value)
    };

    // Podľa módu pridaj companyId alebo companyName
    if (this.registerMode === 'join') {
      const parsedId = parseInt(String(this.f['companyId'].value).trim(), 10);
      if (isNaN(parsedId)) {
        this.serverError = 'Invalid Company ID format';
        this.loading = false;
        return;
      }
      registrationData.companyId = parsedId;
    } else {
      registrationData.companyName = String(this.f['companyName'].value).trim();
    }

    this.loading = true;

    this.auth.register(registrationData).subscribe({
      next: (response) => {
        this.loading = false;

        // Ziskaj Company ID z roznych moznych ciest v odpovedi
        const companyId = response.user?.companyId || (response as any).companyId || 'N/A';

        alert(`Uspesne registrovany uzivatel: ${registrationData.firstName} ${registrationData.lastName}\n\nVASE COMPANY ID JE: ${companyId}\n\nProsim ulozte si toto ID, budete ho potrebovat pre prihlasenie!`);
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
