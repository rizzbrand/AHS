import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1915',
        paper: '#efeae2',
        surface: '#fbf9f5',
        line: '#e2d9cc',
        muted: '#6d655c',
        copper: {
          DEFAULT: '#8c4520',
          soft: '#f3e6dc'
        },
        shell: {
          DEFAULT: '#111112',
          raised: '#1b1b1d',
          line: '#2a2a2d',
          hover: '#1f1f22',
          tile: '#2a2a2d',
          ink: '#f5f3ef',
          text: '#c9c6c0',
          muted: '#9a978f',
          faint: '#6f6c66'
        },
        amber: {
          DEFAULT: '#d9a05b',
          deep: '#c48a45'
        },
        forest: {
          DEFAULT: '#17241f',
          raised: '#22312b',
          canopy: '#31443c'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'sans-serif']
      },
      boxShadow: {
        sheet: '0 18px 50px rgba(28, 25, 21, 0.16)',
        canvas: '0 1px 2px rgba(0, 0, 0, 0.3), 0 16px 48px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
