// jednoduché rozhranie (interface) ktoré definuje čo obsahuje "User"
export interface User {
companyId: string; // ID firmy (unikátne)
firstName: string; // krstné meno
lastName: string; // priezvisko
email: string; // e-mail (unikátny)
address: string; // adresa
password: string; // heslo (v reálnom projekte vždy hashované na serveri)
}