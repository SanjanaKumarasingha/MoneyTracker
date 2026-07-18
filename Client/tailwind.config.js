const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  important: '#root',
  theme: {
    screens: {
      xs: '0px',
      sm: '600px',
      md: '900px',
      lg: '1200px',
      xl: '1536px',
    },
    extend: {
      fontFamily: {
        Barlow: ['Barlow', 'sans-serif'],
      },
      transitionProperty: {
        height: 'height',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
      },
      colors: {
        // Matches Mobile/src/theme/colors.ts exactly (mobile's palette turned
        // out to already be Tailwind's stock amber/green/red/zinc values) so
        // both clients read as one product. `secondary`/`info` are kept
        // (not deleted) because several not-yet-migrated components under
        // src/components/Custom/* still depend on them - new/redesigned
        // surfaces should use primary/zinc/success/danger, not these.
        primary: colors.amber,
        secondary: {
          50: '#F5F4FB',
          100: '#E8E4F6',
          200: '#D4CDEF',
          300: '#BDB2E6',
          400: '#A99BDE',
          500: '#9180D5',
          600: '#664FC5',
          700: '#473399',
          800: '#302267',
          900: '#171032',
          950: '#0C091B',
        },
        info: {
          50: '#F0F8F9',
          100: '#DEF0F2',
          200: '#C0E2E7',
          300: '#9FD3DB',
          400: '#81C5CF',
          500: '#60B6C3',
          600: '#409CAA',
          700: '#30737E',
          800: '#204E55',
          900: '#0F2529',
          950: '#081416',
        },
        success: colors.green,
        danger: colors.red,
        warning: colors.yellow,
      },
    },
  },
  plugins: [],
};
