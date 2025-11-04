/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-theme'], // 👈 pridaj toto
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
