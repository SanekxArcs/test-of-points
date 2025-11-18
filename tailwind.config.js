/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
      '2xl': '1920px',
    },
    extend: {
      fontFamily: {
        'neue-haas': ['Neue Haas Display', 'sans-serif'],
      },
      maskImage: {
        'fade-right': 'linear-gradient(to right, black 0%, black 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
