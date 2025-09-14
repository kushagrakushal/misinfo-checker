/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B111E',
        surface: '#1F2937',
        primary: '#0EA5E9',
        'primary-hover': '#38BDF8',
        secondary: '#4B5563',
        accent: '#F472B6',
        'text-main': '#E5E7EB',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
          'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
      keyframes: {
        'fade-in-up': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

