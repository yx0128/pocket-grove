/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fdf7ea',
        parchment: '#f3e7cf',
        sand: '#e7d5b8',
        sage: '#a9c69b',
        'sage-soft': '#d4e5c9',
        'sage-deep': '#6d8f63',
        forest: '#3d6048',
        moss: '#7e9b72',
        terracotta: '#d17c5b',
        coral: '#e08a68',
        sky: '#bfe3ef',
        'sky-deep': '#8fc7dd',
        sunset: '#f8d9b8',
        ink: '#2f3a34',
        'ink-soft': '#5d6b62',
        gold: '#e9b949',
        'gold-deep': '#c8942b',
        water: '#7cc6d8',
        blossom: '#f4b8c8',
      },
      fontFamily: {
        sans: [
          'SF Pro Rounded',
          'Nunito',
          'ui-rounded',
          'Avenir Next',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'SF Pro Rounded',
          'Nunito',
          'ui-rounded',
          'Avenir Next',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        glass:
          '0 18px 45px -24px rgba(47, 58, 52, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.65)',
        float: '0 16px 35px -20px rgba(47, 58, 52, 0.5)',
        coin: '0 8px 22px -10px rgba(200, 148, 43, 0.75)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'coin-pop': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.18) rotate(-3deg)' },
          '70%': { transform: 'scale(0.97) rotate(1deg)' },
          '100%': { transform: 'scale(1)' },
        },
        'soft-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'modal-in': 'modal-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 220ms ease-out both',
        'coin-pop': 'coin-pop 380ms ease-out',
        'soft-float': 'soft-float 5s ease-in-out infinite',
        'slide-in': 'slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
