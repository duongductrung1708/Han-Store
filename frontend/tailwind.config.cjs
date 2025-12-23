/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#111827",
          light: "#4b5563",
        },
        accent: "#f97316",
      },
    },
  },
  plugins: [],
};


