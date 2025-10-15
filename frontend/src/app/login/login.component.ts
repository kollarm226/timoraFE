import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  submitted = false;
  serverError: string | null = null;
  loading = false;

  loginForm: FormGroup = this.fb.group({
      companyId: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(10),
          this.alphanumericValidator()
        ]
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
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

  
  private alphanumericValidator(): ValidatorFn {
    const regex = /^[A-Za-z0-9]+$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) return null;
      return regex.test(value) ? null : { alphanumeric: true };
    };
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.serverError = null;

    if (this.loginForm.invalid) {
      return;
    }

    const loginData = {
      companyId: String(this.f['companyId'].value).trim(),
      username: String(this.f['username'].value).trim(),
      password: String(this.f['password'].value)
    };

    this.loading = true;

   
    this.auth.login(loginData).subscribe({
      next: () => {
        this.loading = false;
       
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.loading = false;
        const message = (err instanceof Error) ? err.message : 'Login failed. Please check your credentials.';
        this.serverError = message;
        console.log('Login error:', err);
      }
    });
  }
}