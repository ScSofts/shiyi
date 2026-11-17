/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        immich: {
          900: '#0b0f14',
          800: '#11161d',
          700: '#1a212a',
          600: '#232c37',
          500: '#3a4655',
          accent: '#4250af',
        },
      },
    },
  },
  plugins: [],
}