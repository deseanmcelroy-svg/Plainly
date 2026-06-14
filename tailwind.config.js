/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1A2B3D',
        cream: '#F7F4ED',
        terracotta: '#C75D3A',
        green: '#5B8C7B',
        card: '#FFFFFF',
        muted: '#5D6B78',
        line: 'rgba(26,43,61,0.08)',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
};
