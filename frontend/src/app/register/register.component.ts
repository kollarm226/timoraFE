import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  submitted = false;
  serverError: string | null = null;
  loading = false;

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
        [Validators.required, Validators.minLength(5), Validators.maxLength(100), this.addressValidator()]
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
	// Poznámka: druhý parameter Group options môžeme využiť na pridanie "cross-field" validatora



passwordsMatchValidator: ValidatorFn = (group: AbstractControl) => {
const pw = group.get('password')?.value;
const cpw = group.get('confirmPassword')?.value;



return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
};


// Povolené len písmená (vrátane diakritiky) a medzery/čiarky medzi menami
private lettersOnlyValidator(): ValidatorFn {
  const regex = /^[A-Za-zÀ-ž]+(?:[\s'-][A-Za-zÀ-ž]+)*$/u; // podporuje diakritiku
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null; // prázdne rieši required
    return regex.test(value) ? null : { lettersOnly: true };
  };
}

// Alfanumerický reťazec pre companyId (bez medzier)
private alphanumericValidator(): ValidatorFn {
  const regex = /^[A-Za-z0-9]+$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null;
    return regex.test(value) ? null : { alphanumeric: true };
  };
}

// Adresa: povolené písmená, čísla, medzery a .,,-/ znak
private addressValidator(): ValidatorFn {
  const regex = /^[A-Za-zÀ-ž0-9\s.,/-]{5,100}$/u;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null;
    return regex.test(value) ? null : { addressFormat: true };
  };
}

// Sila hesla: min. 1 veľké, 1 malé písmeno, 1 číslo a 1 špeciálny znak
private passwordStrengthValidator(): ValidatorFn {
  const upper = /[A-Z]/;
  const lower = /[a-z]/;
  const digit = /[0-9]/;
  const special = /[^A-Za-z0-9]/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    if (!value) return null;
    const ok = upper.test(value) && lower.test(value) && digit.test(value) && special.test(value);
    return ok ? null : { weakPassword: true };
  };
}



get f() { return this.registerForm.controls; }



onSubmit() {
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


this.loading = true; // loading


// volame mock
this.auth.register(user).subscribe({
  next: () => {
    this.loading = false;
    // show success feedback and stay on register (or navigate to a valid route)
    alert('Úspešne zaregistrovaný používateľ: ' + this.registerForm.value.username);
    this.router.navigate(['/register']);

},

  error: (err: unknown) => {
this.loading = false; 
const message = (err instanceof Error) ? err.message : 'Nastala chyba počas registrácie';
this.serverError = message;

        // tu si môžeš simulovať registráciu – zatiaľ len log
        console.log('Formulár odoslaný:', this.registerForm.value);

}
});
}
}