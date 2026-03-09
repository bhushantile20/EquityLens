/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 20px rgba(16, 185, 129, 0.2)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.2)",
        "brand-glow": "0 0 15px rgba(99, 102, 241, 0.4)",
        "brand-glow-lg": "0 0 25px rgba(99, 102, 241, 0.6)",
      },
      colors: {
        background: "#0f111a",
        surface: "rgba(255, 255, 255, 0.03)",
        surfaceHover: "rgba(255, 255, 255, 0.05)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      backdropBlur: {
        md: "8px",
        lg: "12px",
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
};
