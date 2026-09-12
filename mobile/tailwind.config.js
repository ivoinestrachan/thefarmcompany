/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        farm: {
          DEFAULT: "#2563eb",
          deep: "#1d4ed8",
          soft: "#eff6ff",
        },
      },
    },
  },
  plugins: [],
};
