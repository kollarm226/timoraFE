import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';



@Injectable({ providedIn: 'root' })
export class AuthService {

private getUsers(): User[] {
const raw = localStorage.getItem('users');

return raw ? JSON.parse(raw) as User[] : [];
}


private saveUsers(users: User[]) {
localStorage.setItem('users', JSON.stringify(users));
}


register(user: User): Observable<{ success: boolean; user: User }> {
  const users = this.getUsers();

 
  if (users.find(u => u.companyId?.toLowerCase() === user.companyId.toLowerCase())) {
    return throwError(() => new Error('Company ID už existuje'));
  }

  
  if (users.find(u => u.email?.toLowerCase() === user.email.toLowerCase())) {
    return throwError(() => new Error('E-mailová adresa je už použitá'));
  }

  users.push(user);
  this.saveUsers(users);

  return of({ success: true, user }).pipe(delay(500));
}

login(credentials: { companyId: string; username: string; password: string }): Observable<{ success: boolean; user: User }> {
  const users = this.getUsers();
  
  
  const user = users.find(u => 
    u.companyId?.toLowerCase() === credentials.companyId.toLowerCase() &&
    (u.firstName?.toLowerCase() === credentials.username.toLowerCase() || 
     u.lastName?.toLowerCase() === credentials.username.toLowerCase() ||
     `${u.firstName} ${u.lastName}`.toLowerCase() === credentials.username.toLowerCase())
  );

  if (!user) {
    return throwError(() => new Error('Invalid credentials'));
  }

  if (user.password !== credentials.password) {
    return throwError(() => new Error('Invalid password'));
  }

  return of({ success: true, user }).pipe(delay(500));
}
}