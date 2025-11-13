/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'neue-haas': ['Neue Haas Display', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
