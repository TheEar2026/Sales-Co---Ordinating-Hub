/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Themed semantic tokens (flip on .dark via CSS vars)
        app: 'rgb(var(--c-app) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        chrome: 'rgb(var(--c-chrome) / <alpha-value>)',
        'gold-light': 'rgb(var(--c-gold-light) / <alpha-value>)',
        'green-light': 'rgb(var(--c-green-light) / <alpha-value>)',
        'amber-light': 'rgb(var(--c-amber-light) / <alpha-value>)',
        'red-light': 'rgb(var(--c-red-light) / <alpha-value>)',
        'email-bg': 'rgb(var(--c-email-bg) / <alpha-value>)',
        'email-line': 'rgb(var(--c-email-line) / <alpha-value>)',
        'email-ink': 'rgb(var(--c-email-ink) / <alpha-value>)',
        // Fixed brand + semantic colors (work on both themes)
        navy: '#1F2D3D',
        gold: '#B8860B',
        'gold-mid': '#D4A017',
        'brand-gold': '#B8935A',
        green: '#2E7D4F',
        red: '#B23A3A',
        amber: '#C17F24',
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
