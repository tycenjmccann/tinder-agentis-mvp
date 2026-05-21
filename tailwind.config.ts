import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'replay-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.8' },
        },
        'scrubber-enter': {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        'indicator-enter': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'replay-pulse': 'replay-pulse 1.5s ease-in-out infinite',
        'scrubber-enter': 'scrubber-enter 300ms ease-out forwards',
        'indicator-enter': 'indicator-enter 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
