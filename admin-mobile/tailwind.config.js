const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['GoogleSans_400Regular', 'sans-serif'],
        medium: ['GoogleSans_500Medium', 'sans-serif'],
        bold: ['GoogleSans_700Bold', 'sans-serif'],
      },
      colors: {
        gray: colors.neutral,
        system: {
          blue: '#007AFF',
          bg: '#F2F2F7',
          gray: '#8E8E93',
          light: '#E5E5EA',
        }
      }
    },
  },
  plugins: [],
}
