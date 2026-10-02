/** @type {import('tailwindcss').Config} */
// VVF Design System tokens — do not approximate; these are exact.
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        background: '#ffffff',
        surface: '#f2f2f2',
        foreground: '#333333',
        muted: '#758696',
        border: '#e7e7e7',
        // Brand colors
        brand: {
          navy: '#02335e',
          'navy-dark': '#012244',
          cyan: '#00abf9',
          'cyan-dark': '#0095d9',
        },
        // Legacy aliases for existing component compatibility
        'brand-sky': '#00abf9',
        'brand-sky-dark': '#0095d9',
        // Feature card pastels (from design system posture)
        pastel: {
          sun: '#f9eac6',
          salmon: '#ffd7d7',
          sky: '#c1e7f5',
        },
        // Text shades
        ink: {
          900: '#333333',
          700: '#4a4a4a',
          500: '#758696',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['Open Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.1em' }],
        'display-sm': ['1.75rem', { lineHeight: '2.25rem' }],
        'display-md': ['2.25rem', { lineHeight: '2.5rem' }],
        'display-lg': ['3rem', { lineHeight: '1.1' }],
        'display-xl': ['3.75rem', { lineHeight: '1.05' }],
        stat: ['2.5rem', { lineHeight: '1' }],
      },
      borderRadius: {
        pill: '999px',
        card: '0.5rem', // 8px per design system
        DEFAULT: '0.5rem',
      },
      maxWidth: {
        container: '80rem',
      },
      spacing: {
        section: '5rem',
        'section-sm': '3rem',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}
