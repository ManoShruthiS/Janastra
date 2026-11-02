/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'silver-matte': '#9ca3af',
        'silver-metallic': '#c0c0c0',
        'gold-champagne': '#d4af37',
        obsidian: {
          950: '#000000',
          900: '#050505',
          850: '#0a0a0b',
          800: '#111113',
          700: '#18181b',
          600: '#222226'
        },
        gold: {
          light: '#fdf6db',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          champagne: '#d4af37',
          deep: '#b89028',
          metallic: '#c5a059',
        },
        silver: {
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          matte: '#9ca3af',
          metallic: '#c0c0c0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'silver-glow': '0 0 25px -5px rgba(192, 192, 192, 0.15)',
        'obsidian-inner': 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
