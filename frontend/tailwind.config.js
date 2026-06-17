/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FE2C55',
        'bg-black': '#000000',
        'card-bg': '#161823',
      },
    },
  },
  plugins: [],
}
