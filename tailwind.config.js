/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#0a0a0a',
          100: '#0f0f0f',
          200: '#141414',
          300: '#1a1a1a',
          400: '#1f1f1f',
          500: '#242424',
          600: '#2a2a2a',
          700: '#2f2f2f',
          800: '#050505',
          900: '#020202',
          950: '#000000',
        },
      },
    },
  },
  plugins: [],
};
