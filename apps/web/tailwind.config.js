/* tailwind.config.js */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: "#69a297",
        sage: "#a3c9a8",
        tealLight: "#84b59f",
        tealDark: "#50808e",
        darkAccent: "#2c3e50",
        cream: "#ddd8c4",

        // Activity-specific colors
        settledColor: "#4caf50",
        settledBg: "rgba(76, 175, 80, 0.1)",
        youOweColor: "#ff9800",
        youOweBg: "rgba(255, 152, 0, 0.1)",
        youAreOwedColor: "#2196f3",
        youAreOwedBg: "rgba(33, 150, 243, 0.1)",
        expenseColor: "#50808e", // tealDark
        expenseBg: "rgba(80, 128, 142, 0.1)",
        paymentColor: "#9c27b0",
        paymentBg: "rgba(156, 39, 176, 0.1)",
      },
      boxShadow: {
        sm: "0 3px 10px rgba(0, 0, 0, 0.04)",
        md: "0 5px 15px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
