/** @type {import('tailwindcss').Config} */
module.exports = {
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#1e40af",
          secondary: "#d946ef",
          accent: "#ffffff",
          neutral: "#111827",
          "base-100": "#1f2937",
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#facc15",
          error: "#dc2626",
        },
      },
    ],
  },
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
};