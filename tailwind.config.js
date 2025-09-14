/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // This is the refined color palette for a more modern look
      colors: {
        background: '#0B111E',    // A deep, dark navy blue
        surface: '#1F2937',       // Lighter gray-blue for cards and headers
        primary: '#0EA5E9',       // A vibrant, rich sky blue for main actions
        'primary-hover': '#38BDF8',// A slightly lighter blue for hover effects
        secondary: '#4B5563',     // Muted gray for secondary elements
        accent: '#F472B6',        // A pink/magenta accent for highlights
        'text-main': '#E5E7EB',      // Off-white for primary text
        'text-secondary': '#9CA3AF', // Lighter gray for secondary text
      },
      fontFamily: {
         // Ensures the 'Inter' font is applied correctly
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  // This is the crucial fix: adding the typography plugin
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
