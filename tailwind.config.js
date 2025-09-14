/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111827', // A dark navy
        surface: '#1F2937',    // A slightly lighter gray-blue
        primary: '#38BDF8',    // A vibrant sky blue for accents
        secondary: '#4B5563',  // Muted gray for secondary text/borders
        accent: '#F472B6',     // A pink accent for ratings or highlights
        'text-main': '#E5E7EB',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
         // Ensures Inter font is properly configured
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}