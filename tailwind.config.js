/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1F2D3D',
        gold: '#B8860B',
        'gold-light': '#F5EFE0',
        'gold-mid': '#D4A017',
        green: '#2E7D4F',
        'green-light': '#EAF3EC',
        red: '#B23A3A',
        'red-light': '#FAF0F0',
        amber: '#C17F24',
        'amber-light': '#FEF3E2',
      },
    },
  },
  plugins: [],
}
