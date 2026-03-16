/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sora)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        todoIn: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s cubic-bezier(0.4,0,0.2,1)',
        todoIn: 'todoIn 0.3s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
}
