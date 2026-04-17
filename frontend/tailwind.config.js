export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e1f5ee',
          100: '#9fe1cb',
          200: '#5dcaa5',
          300: '#2db88a',
          400: '#1d9e75',
          500: '#178a64',
          600: '#0f6e56',
          700: '#085041',
          900: '#04342c',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warn: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
    },
  },
  plugins: [],
}
