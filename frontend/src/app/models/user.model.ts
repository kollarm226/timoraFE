/**
 * User model pre lokalne prihlasovanie
 * Pouziva sa v auth.service.ts (localStorage)
 */
export interface User {
  companyId: string | number;   // ID firmy (unikatne)
  firstName: string;   // krstne meno
  lastName: string;    // priezvisko
  email: string;       // e-mail (unikatny)
  address: string;     // adresa
  password: string;    // heslo (v realnom projekte vzdy hashovane na serveri)
  userName?: string;   // volitelne uzivatelske meno
  companyName?: string; // volitelny nazov firmy (pri registracii)
}
