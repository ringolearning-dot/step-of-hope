import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#B8860B',
        'gold-light': '#D4A542',
        navy: '#1B2A4A',
        'navy-soft': '#2C3E6B',
        hope: '#5B8DBE',
        'hope-light': '#7EAED3',
        'hope-dark': '#3D6F9E',
        warm: '#D4756A',
        'warm-light': '#E8A59E',
        'bg-lavender': '#EEF0F7',
        'bg-warm': '#FAFAFA',
        'card-peach': '#F5E6D0',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(91,141,190,0)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(91,141,190,0.25)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
