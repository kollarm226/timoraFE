/**
 * User model pre lokalne prihlasovanie
 * Pouziva sa v auth.service.ts (localStorage)
 */
export interface User {
  id?: number;         // backend user id if available
  companyId: string | number;   // ID firmy (unikatne)
  firstName: string;   // krstne meno
  lastName: string;    // priezvisko
  email: string;       // e-mail (unikatny)
  address: string;     // adresa
  password: string;    // heslo (v realnom projekte vzdy hashovane na serveri)
  userName?: string;   // volitelne uzivatelske meno
  companyName?: string; // volitelny nazov firmy (pri registracii)
  role?: number;       // rola uzivatela (0=Employee, 1=Employer, 2=Admin)
  isApproved?: boolean;  // ci je uzivatel schvaleny zamestnavatelom (default true pre creatorov, false pre joinery)
}
