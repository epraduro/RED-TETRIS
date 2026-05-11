/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        caesar: ['Caesar Dressing', 'sans-serif'], // Ajoutez votre police ici
      },
    },
  },
  plugins: [],
}

