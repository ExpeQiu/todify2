/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#f0f9ff',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', 'monospace'],
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
      },
      borderRadius: {
        'base': '0.25rem',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'colored': '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
      },
      animation: {
        'float-vertical': 'float-vertical 3s ease-in-out infinite',
        'float-horizontal': 'float-horizontal 3s ease-in-out infinite',
        'float-circular': 'float-circular 3s ease-in-out infinite',
        'pulse-custom': 'pulse-custom 2s ease-in-out infinite',
      },
      perspective: {
        '1000': '1000px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      },
      rotate: {
        'y-180': 'rotateY(180deg)',
      },
      transitionDuration: {
        '600': '600ms',
      },
      keyframes: {
        'float-vertical': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-horizontal': {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(-10px)' },
        },
        'float-circular': {
          '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
          '25%': { transform: 'translate(5px, -5px) rotate(90deg)' },
          '50%': { transform: 'translate(0px, -10px) rotate(180deg)' },
          '75%': { transform: 'translate(-5px, -5px) rotate(270deg)' },
        },
        'pulse-custom': {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 var(--pulse-color, rgba(99, 102, 241, 0.4))'
          },
          '50%': { 
            transform: 'scale(var(--pulse-scale, 1.05))',
            boxShadow: '0 0 0 10px var(--pulse-color, rgba(99, 102, 241, 0))'
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}