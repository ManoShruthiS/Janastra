/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        janastra: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#3b82f6',
          highlight: '#10b981',
          gold: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
