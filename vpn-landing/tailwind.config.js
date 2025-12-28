/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: '#1A121F',      // Глубокий темный фон
        card: '#521224',      // Благородный бордовый
        accent: '#521224',    // Акцент (он же бордовый)
        secondary: '#473452', // Светлый фиолетовый
        tertiary: '#42304C',  // Темный фиолетовый
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        exo: ['"Exo 2"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}