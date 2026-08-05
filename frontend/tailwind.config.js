/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#f2f5fc',
          purple: '#7b68ee',
          purpleLight: '#ebe8ff',
          blue: '#4fc3f7',
          pink: '#ff8a80',
          green: '#81c784',
          text: '#333333',
          textMuted: '#9e9e9e',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px 0 rgba(0,0,0,0.05)',
      }
    }
  },
  plugins: [],
}
