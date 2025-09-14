/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B111E', // Even darker, deeper navy
        surface: '#1F2937',
        primary: '#0EA5E9',    // A slightly richer sky blue (from sky-500)
        'primary-hover': '#38BDF8', // Lighter for hover (from sky-400)
        secondary: '#4B5563',
        accent: '#F472B6',
        'text-main': '#E5E7EB',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
         // Ensures Inter font is properly configured
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Add this plugin
  ],
}