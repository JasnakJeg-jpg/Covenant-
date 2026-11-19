/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#F3F5F4',
        ink: '#18212F',
        muted: '#556070',
        line: '#D6DCD9',
        sage: {
          50: '#F0F6F3',
          100: '#E3EFEA',
          300: '#A9D8C8',
          700: '#2F6B5B',
          900: '#1F4D41',
        },
        flag: {
          bg: '#FBF0DC',
          ink: '#6E4A0E',
          line: '#E9C98F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
