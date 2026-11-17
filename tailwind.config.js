/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EE',
        sage: {
          50: '#F3F6F1',
          100: '#E3EBDF',
          300: '#A9BFA2',
          500: '#7A9A71',
          700: '#53704B',
          900: '#2F4229',
        },
        ink: '#2B2B27',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
