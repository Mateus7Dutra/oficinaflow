/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2942',
          light: '#1A3A5C',
          dark: '#0A1C2E',
        },
        amberFlow: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
        surface: '#F4F7FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
