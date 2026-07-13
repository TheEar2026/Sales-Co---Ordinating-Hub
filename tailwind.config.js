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
        'brand-gold': '#9E814B',
        green: '#2E7D4F',
        'green-light': '#EAF3EC',
        red: '#B23A3A',
        'red-light': '#FAF0F0',
        amber: '#C17F24',
        'amber-light': '#FEF3E2',
        'text-muted': '#6B7280',
        border: '#E5E7EB',
        surface: '#F8F9FA',
        'on-surface': '#191C1D',
        'on-surface-variant': '#44474C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Courier Prime"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        'metric-xl': ['28px', { lineHeight: '1', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'data-mono': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'micro-label': ['11px', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
