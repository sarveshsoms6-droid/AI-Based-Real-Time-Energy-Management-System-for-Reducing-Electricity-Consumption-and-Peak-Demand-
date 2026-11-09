/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme palette with CSS variable fallbacks
        page: 'var(--color-page, #F7F5F0)',
        card: 'var(--color-card, #FFFFFF)',
        'border-soft': 'var(--color-border-soft, #E7E3DA)',
        'border-strong': 'var(--color-border-strong, #D3CEC4)',
        
        // Text shades
        slate: {
          900: '#1F2933', // Primary text
          800: '#323F4B',
          700: '#3E4C59',
          600: '#52606D', // Secondary text
          500: '#7B8794', // Muted text
          400: '#9AA5B1',
          300: '#CBD2D9',
          200: '#E4E7EB',
          100: '#F5F7FA',
          50: '#FAF8F3',
        },
        
        // Calm accents requested
        savings: {
          DEFAULT: '#2E7D5B', // Calm green
          light: '#EBF5F0',
          dark: '#215941',
        },
        warning: {
          DEFAULT: '#D97706', // Amber
          light: '#FEF3C7',
          dark: '#B45309',
        },
        wastage: {
          DEFAULT: '#D64545', // Calm red
          light: '#FDE8E8',
          dark: '#A82D2D',
        },
        cit: {
          blue: '#1D4ED8',
          light: '#EFF6FF',
          dark: '#1E40AF',
        },

        // Backward compatibility mappings
        navy: {
          950: '#F7F5F0', // Replaced dark background with page off-white
          900: '#FFFFFF', // Replaced with card white
          850: '#FAF8F5',
          800: '#F0ECE1',
          750: '#E7E3DA',
          700: '#D3CEC4',
          600: '#9AA5B1',
        },
        cyan: {
          400: '#0284C7',
          500: '#0369A1',
        },
        electric: {
          blue: '#1D4ED8',
          cyan: '#0284C7',
          neon: '#2E7D5B',
          amber: '#D97706',
          rose: '#D64545',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow-cyan': '0 0 15px -3px rgba(2, 132, 199, 0.25)',
        'glow-green': '0 0 15px -3px rgba(46, 125, 91, 0.25)',
        'glow-amber': '0 0 15px -3px rgba(217, 119, 6, 0.25)',
        'glow-rose': '0 0 15px -3px rgba(214, 69, 69, 0.25)',
      },
    },
  },
  plugins: [],
}
