/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      colors: {
        // Define your palette here — will be populated from DESIGN.md
      },
    },
  },
  plugins: [],
}
