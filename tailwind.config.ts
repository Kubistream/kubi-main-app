import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#6B46C1",
        "accent-pink": "#F778BA",
        "accent-yellow": "#FFD166",
        "accent-cyan": "#06D6A0",
        "accent-orange": "#FB923C",
        "background-light": "#f8fafc",
        "background-dark": "#0B061D",
        "surface-dark": "#181033",
        "surface-light": "#ffffff",
        "border-dark": "#2D2452",
      },
      fontFamily: {
        "display": ["Outfit", "sans-serif"],
        "body": ["Manrope", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "full": "9999px"
      },
      boxShadow: {
        'fun': '4px 4px 0px 0px rgba(0,0,0,1)',
        'fun-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "zoom-in": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "zoom-in-95": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "spring-bounce": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "enter-slide-left": "slide-in-from-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "enter-slide-bottom": "slide-in-from-bottom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "enter-zoom": "zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "enter-zoom-sm": "zoom-in-95 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spring-bounce": "spring-bounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }
    },
  },
  plugins: [],
} satisfies Config;

export default config;
