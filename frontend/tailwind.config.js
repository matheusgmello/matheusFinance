/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        xs:   ['13px', { lineHeight: '1.4' }],
        sm:   ['15px', { lineHeight: '1.5' }],
        base: ['17px', { lineHeight: '1.6' }],
        lg:   ['19px', { lineHeight: '1.5' }],
        xl:   ['21px', { lineHeight: '1.4' }],
        '2xl':['25px', { lineHeight: '1.3' }],
        '3xl':['31px', { lineHeight: '1.2' }],
        '4xl':['37px', { lineHeight: '1.1' }],
      },
      colors: {
        accent: {
          50:  'rgb(var(--accent-50) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
        },
        due:     'rgb(var(--state-due) / <alpha-value>)',
        overdue: 'rgb(var(--state-overdue) / <alpha-value>)',
        paid:    'rgb(var(--state-paid) / <alpha-value>)',
        neutral: 'rgb(var(--state-neutral) / <alpha-value>)',
        'bg-body':    'rgb(var(--bg-body) / <alpha-value>)',
        'bg-card':    'rgb(var(--bg-card) / <alpha-value>)',
        'bg-sidebar': 'rgb(var(--bg-sidebar) / <alpha-value>)',
        'bg-elevated':'rgb(var(--bg-elevated) / <alpha-value>)',
        'c-primary':  'rgb(var(--text-primary) / <alpha-value>)',
        'c-muted':    'rgb(var(--text-muted) / <alpha-value>)',
        'c-border':   'rgb(var(--border-color) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
