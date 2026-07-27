/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        th: {
          50: '#f5f5f5', 100: '#e7e7e7', 200: '#c9c9c9', 300: '#a3a3a3',
          400: '#6b6b6b', 500: '#3a3a3a', 600: '#2a2a2a', 700: '#1f1f1f',
          800: '#171717', 900: '#121212', 950: '#0a0a0a',
        },
        gold: {
          50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
          400: '#c9a96e', 500: '#b8943e', 600: '#a17f2f', 700: '#856824',
          800: '#6d5320', 900: '#5a441c',
        },
        cream: {
          50: '#fefdf8', 100: '#fdf9ed', 200: '#faf0d5', 300: '#f5e5b8',
        },
      },
    },
  },
  plugins: [],
};
