/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        farm: {
          DEFAULT: "#3f7a3f",
          deep: "#2f5a2f",
          soft: "#eef4ee",
        },
      },
    },
  },
  plugins: [],
};
