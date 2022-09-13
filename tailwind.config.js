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
      animation: {
        wiggle: 'wiggle 1.5s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
};
