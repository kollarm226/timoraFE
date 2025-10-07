import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  serverError: string | null = null;
  loading = false;

  constructor(
	private fb: FormBuilder,
	private auth: AuthService,
	private router: Router
  ) {
	this.registerForm = this.fb.group({
	  companyId: ['', Validators.required],
	  username: ['', [Validators.required, Validators.minLength(4)]],
	  firstName: ['', Validators.required],
	  lastName: ['', Validators.required],
	  email: ['', [Validators.required, Validators.email]],
	  birthdate: ['', Validators.required],
	  password: ['', [Validators.required, Validators.minLength(6)]],
	  confirmPassword: ['', Validators.required]
	}, { validators: this.passwordsMatchValidator });
	// Poznámka: druhý parameter Group options môžeme využiť na pridanie "cross-field" validatora
  }


ngOnInit(): void {

}



passwordsMatchValidator: ValidatorFn = (group: AbstractControl) => {
const pw = group.get('password')?.value;
const cpw = group.get('confirmPassword')?.value;



return pw && cpw && pw !== cpw ? { passwordsNotMatching: true } : null;
};



get f() { return this.registerForm.controls; }



onSubmit() {
this.submitted = true; 
this.serverError = null; 



if (this.registerForm.invalid) {
return;
}



const user: User = {
companyId: this.f['companyId'].value,
username: this.f['username'].value,
firstName: this.f['firstName'].value,
lastName: this.f['lastName'].value,
email: this.f['email'].value,
birthdate: this.f['birthdate'].value,
password: this.f['password'].value
};


this.loading = true; // loading


// volame mock
this.auth.register(user).subscribe({
next: (res) => {
    this.loading = false;
    // show success feedback and stay on register (or navigate to a valid route)
    alert('Úspešne zaregistrovaný používateľ: ' + this.registerForm.value.username);
    this.router.navigate(['/register']);

},

error: (err) => {
this.loading = false; 

this.serverError = err?.message || 'Nastala chyba počas registrácie';

        // tu si môžeš simulovať registráciu – zatiaľ len log
        console.log('Formulár odoslaný:', this.registerForm.value);

}
});
}
}