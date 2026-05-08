/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        mint: {
          50: '#ecfdf5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px -4px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)',
        'glow': '0 0 0 4px rgb(59 130 246 / 0.15)',
        'card': '0 8px 30px -8px rgb(15 23 42 / 0.10), 0 2px 6px -2px rgb(15 23 42 / 0.05)',
      },
      backgroundImage: {
        'aurora': 'radial-gradient(60% 60% at 50% 0%, #dbeafe 0%, transparent 70%), radial-gradient(50% 60% at 100% 100%, #d1fae5 0%, transparent 70%), radial-gradient(60% 50% at 0% 80%, #ede9fe 0%, transparent 70%)',
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'mint-gradient': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        'count-up': {
          '0%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'count-up': 'count-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
