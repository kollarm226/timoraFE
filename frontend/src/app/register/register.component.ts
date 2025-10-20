import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  submitted = false;
  serverError: string | null = null;
  loading = false;
  isDark = false;

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
	



private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
}



private lettersOnlyValidator(): ValidatorFn {
  const regex = /^[A-Za-zÀ-ž]+(?:[\s'-][A-Za-zÀ-ž]+)*$/u; 
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null; 
    return regex.test(value) ? null : { lettersOnly: true };
  };
}


private alphanumericValidator(): ValidatorFn {
  const regex = /^[A-Za-z0-9]+$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null;
    return regex.test(value) ? null : { alphanumeric: true };
  };
}


private addressValidator(): ValidatorFn {
  const regex = /^[A-Za-zÀ-ž0-9\s.,/-]{5,100}$/u;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    if (!value) return null;
    return regex.test(value) ? null : { addressFormat: true };
  };
}


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


this.loading = true; 



this.auth.register(user).subscribe({
  next: () => {
    this.loading = false;
    
    alert('Úspešne zaregistrovaný používateľ: ' + this.registerForm.value.username);
    this.router.navigate(['/register']);

},

  error: (err: unknown) => {
this.loading = false; 
const message = (err instanceof Error) ? err.message : 'Nastala chyba počas registrácie';
this.serverError = message;

       
        console.log('Formulár odoslaný:', this.registerForm.value);

}
});
}

  ngOnInit(): void {
    
    this.document.body.classList.add('auth-no-scroll');
    this.isDark = this.document.body.classList.contains('dark-theme');
  }

  ngOnDestroy(): void {
    
    this.document.body.classList.remove('auth-no-scroll');
  }

  toggleTheme(): void {
    const root = this.document.body.classList;
    const willEnableDark = !root.contains('dark-theme');
    if (willEnableDark) {
      root.add('dark-theme');
    } else {
      root.remove('dark-theme');
    }
    this.isDark = willEnableDark;
  }
}