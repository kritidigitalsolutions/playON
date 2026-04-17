module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sportBlue: "#0EA5FF",
        deepBlue: "#06152B",
        darkNavy: "#081120",
        accentOrange: "#FF8A00"
      },
      boxShadow: {
        neon: "0 0 24px rgba(14, 165, 255, 0.45)",
        glass: "0 12px 40px rgba(3, 10, 28, 0.45)"
      },
      backgroundImage: {
        "hero-overlay":
          "linear-gradient(120deg, rgba(6, 21, 43, 0.85), rgba(8, 17, 32, 0.45))"
      }
    }
  },
  plugins: []
};
