/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0f172a",
        surface: "#1e293b",
        panel: "#0f1f3a",
        border: "#1e3a5f",
        accent: "#3b82f6",
        "accent-light": "#60a5fa",
        profit: "#22c55e",
        loss: "#ef4444",
        muted: "#64748b",
      },
      fontFamily: {
        display: ["'DM Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
