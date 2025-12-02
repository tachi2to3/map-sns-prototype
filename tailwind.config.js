/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          beige: '#Decbb7', // メインのベージュ
          dark: '#1a1a1a',  // 背景の黒
          black: '#0f0f0f', // 濃い黒
        }
      },
      fontFamily: {
        // 丸ゴシック風のフォントを適用（もしWebフォントがあればここで指定）
        sans: ['"Hiragino Maru Gothic ProN"', '"Rounded Mplus 1c"', 'sans-serif'],
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}