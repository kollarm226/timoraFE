import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';


// Injectable s providedIn: 'root' znamená že Angular automaticky poskytne tento servis naprieč aplikáciou.
@Injectable({ providedIn: 'root' })
export class AuthService {
constructor() { }

private getUsers(): User[] {
const raw = localStorage.getItem('users');

return raw ? JSON.parse(raw) as User[] : [];
}


private saveUsers(users: User[]) {
localStorage.setItem('users', JSON.stringify(users));
}


register(user: User): Observable<{ success: boolean; user: User }> {
const users = this.getUsers();



if (users.find(u => u.username === user.username)) {

return throwError(() => new Error('Užívateľské meno už existuje'));
}



if (users.find(u => u.email === user.email)) {
return throwError(() => new Error('E-mailová adresa je už použitá'));
}



users.push(user);
this.saveUsers(users);



return of({ success: true, user }).pipe(delay(500));



}
}