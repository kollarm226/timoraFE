/**
 * User model pre lokalne prihlasovanie
 * Pouziva sa v auth.service.ts (localStorage)
 */
export interface User {
  companyId: string;   // ID firmy (unikatne)
  firstName: string;   // krstne meno
  lastName: string;    // priezvisko
  email: string;       // e-mail (unikatny)
  address: string;     // adresa
  password: string;    // heslo (v realnom projekte vzdy hashovane na serveri)
}
