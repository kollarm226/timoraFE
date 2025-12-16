import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface ContactItem {
  name: string;
  role: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contacts: ContactItem[] = [
    { name: 'Michael Jisacle', role: 'CEO' },
    { name: 'Jasmine Cluy', role: 'Sales Director' },
    { name: 'Peter Nylon', role: 'Marketing Manager' },
    { name: 'Robert Mourtney', role: 'Human Resources Manager' },
    { name: 'Matteo Nebors', role: 'Project Manager' },
    { name: 'Eric Arley', role: 'Executive Assistant' },
    { name: 'Matthew Vane', role: 'Customer Support Specialist' },
    { name: 'Daniel Glorser', role: 'Operations Manager' }
  ];
}
