/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        family: "#E8826B",
        work: "#7A9B7A",
        personal: "#8B86C9",
      },
    },
  },
  plugins: [],
};
