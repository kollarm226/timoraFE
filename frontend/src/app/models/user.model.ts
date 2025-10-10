// jednoduché rozhranie (interface) ktoré definuje čo obsahuje "User"
export interface User {
companyId: string; // id firmy (z formulára)
username: string; // užívateľské meno
firstName: string; // krstné meno
lastName: string; // priezvisko
email: string; // e-mail
birthdate: string; // dátum narodenia (uložíme ako string ISO yyyy-mm-dd)
password: string; // heslo (v reálnom projekte nikdy neukladať plain text na serveri)
}