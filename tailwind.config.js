/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FBF7EE',
        foreground: '#172319',
        card: '#FFFDF8',
        border: '#DEDAD0',
        ring: '#557C62',
        primary: { DEFAULT: '#3B5440', foreground: '#FBF8F1' },
        secondary: { DEFAULT: '#E2EBDD', foreground: '#1D3425' },
        muted: { DEFAULT: '#EFEBE2', foreground: '#5D665B' },
        accent: { DEFAULT: '#F0DAC2', foreground: '#774826' },
        preview: { DEFAULT: '#F8EACE', foreground: '#65461E' },
        destructive: '#CC2827',
      },
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      backgroundImage: {
        hero: 'linear-gradient(150deg, #314936, #4C6247 65%, #7C7148)',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(35 50 38 / 0.06), 0 8px 24px -12px rgb(35 50 38 / 0.18)',
      },
      borderRadius: {
        card: '22px',
        hero: '32px',
      },
    },
  },
  plugins: [],
}
