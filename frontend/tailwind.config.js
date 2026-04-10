/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f1419',
          card: '#1a1f2e',
          hover: '#252b3b',
        },
        primary: {
          cyan: '#14b8a6',
          purple: '#a855f7',
          pink: '#ec4899',
          orange: '#f97316',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
      },
    },
  },
  plugins: [],
}


