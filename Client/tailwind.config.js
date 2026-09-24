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
        // Executive-fintech UI face (Inter, falling back to the platform's
        // SF Pro / Segoe) - used app-wide via Layout and the auth pages.
        lux: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      transitionProperty: {
        height: 'height',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      // Mirrors Mobile/src/theme/shadows.ts's `card` shadow (shadowOpacity
      // 0.05, shadowRadius 12, offset y4) - a softer, more "floating" card
      // than Tailwind's stock shadow-sm/shadow-lg steps.
      boxShadow: {
        card: '0 4px 12px -2px rgb(22 21 31 / 0.05)',
      },
      colors: {
        // Matches Mobile/src/theme/colors.ts exactly (mobile's palette turned
        // out to already be Tailwind's stock blue/green/red/zinc values -
        // primary #2563eb/#1d4ed8/#dbeafe is exactly blue-600/700/100) so
        // both clients read as one product. `secondary`/`info` are kept
        // (not deleted) because several not-yet-migrated components under
        // src/components/Custom/* still depend on them - new/redesigned
        // surfaces should use primary/zinc/success/danger, not these.
        primary: colors.blue,
        // Every `zinc-*` class in the app (hundreds of them, light + dark)
        // now resolves to Tailwind's `slate` scale - a blue-tinted neutral
        // that gives the dark theme its layered navy-slate depth
        // (zinc-900 #0F172A page, zinc-800 #1E293B card surface, zinc-700
        // #334155 borders) and pairs with the Royal Blue primary far better
        // than zinc's flat grey. Done here once instead of rewriting every
        // class in every file.
        zinc: colors.slate,
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
        // Semantic money colors: income/positive = emerald, expense/negative
        // = rose, goals/caution = amber. Emerald/rose read cleaner on dark
        // slate than stock green/red (which vibrate and fail contrast at
        // the -400 step), and keep income/expense distinguishable at a
        // glance for the most common color-vision deficiencies better than
        // pure green vs. pure red.
        success: colors.emerald,
        danger: colors.rose,
        warning: colors.amber,
      },
    },
  },
  plugins: [],
};
