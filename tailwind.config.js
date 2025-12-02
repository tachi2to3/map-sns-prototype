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
      }
    },
  },
  plugins: [],
}