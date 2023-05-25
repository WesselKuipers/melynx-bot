/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mhRed: '#EC1904',
        mhOrange: '#FB7804',
        mhYellow: '#FCFB00',
        mhGreen: '#2EDE79',
        mhBlue: '#0C67FC',
        mhWhite: '#FFFAFF',
        mhPurple: '#E300C7',
      },
    },
  },
  plugins: [],
};
