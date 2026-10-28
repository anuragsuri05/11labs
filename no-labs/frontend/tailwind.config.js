/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        sub: 'rgb(var(--sub) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        inv: 'rgb(var(--inv) / <alpha-value>)',
        invfg: 'rgb(var(--invfg) / <alpha-value>)',
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
      },
      boxShadow: {
        pop: '0 8px 30px -6px rgb(0 0 0 / 0.14), 0 2px 6px -2px rgb(0 0 0 / 0.08)',
        card: '0 1px 2px rgb(0 0 0 / 0.04)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(4px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        indeterminate: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
        orb: { '0%,100%': { transform: 'rotate(0deg) scale(1)' }, '50%': { transform: 'rotate(180deg) scale(1.08)' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .16s ease-out',
        'slide-up': 'slide-up .22s ease-out',
        'slide-in': 'slide-in .2s ease-out',
        orb: 'orb 6s ease-in-out infinite',
        indeterminate: 'indeterminate 1.3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
