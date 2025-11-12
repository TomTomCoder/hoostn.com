/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './apps/web/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F3A8A',
          dark: '#2E4CCB',
          light: '#3559C8',
        },
        accent: {
          DEFAULT: '#00C48C',
          dark: '#009F72',
        },
        gray: {
          anthracite: '#333333',
          light: '#F5F6F8',
        },
        error: '#E53E3E',
        dark: {
          DEFAULT: '#0D1117',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
