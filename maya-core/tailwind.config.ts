import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#020617',
        panel: '#0f172a',
        panelSoft: '#111c34',
        line: '#223152',
        accent: '#8b5cf6',
        accentSoft: '#22d3ee',
        glow: '#f59e0b'
      },
      boxShadow: {
        shell: '0 24px 80px rgba(2, 6, 23, 0.42)'
      },
      backgroundImage: {
        radial: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.18), transparent 35%)'
      }
    }
  },
  plugins: []
};

export default config;
