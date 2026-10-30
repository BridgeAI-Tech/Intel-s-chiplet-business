/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        intel: {
          blue: "#0068B5",
          dark: "#003C71",
          light: "#00A3E0",
          accent: "#00C7FD",
          navy: "#0A192F",
          card: "#0F2442",
        },
      },
    },
  },
  plugins: [],
}
