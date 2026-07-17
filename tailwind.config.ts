import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        rose: {
          blush: "#fff8f3",
          light: "#e8cfc3",
          main: "#b88a78",
          deep: "#8a6252",
        },
        warm: {
          brown: "#5c4a3a",
          cream: "#fdf4ed",
        },
      },
      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "fade-up": "fadeUp 0.8s ease-out",
        "envelope-open": "envelopeOpen 1.2s ease-in-out forwards",
        float: "float 3s ease-in-out infinite",
        "petal-fall": "petalFall 4s ease-in-out infinite",
        "slide-up": "slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "slide-down": "slideDown 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "slide-in-side": "slideInSide 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "slide-out-side": "slideOutSide 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "slide-in-side-right": "slideInSideRight 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "slide-out-side-right": "slideOutSideRight 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "butterfly": "butterfly 6s ease-in-out infinite",
        "bloom-out": "bloomOut 0.8s ease-out forwards",
        "curtain-left": "curtainLeft 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards",
        "curtain-right": "curtainRight 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        envelopeOpen: {
          "0%": { transform: "scaleY(1)", opacity: "1" },
          "50%": { transform: "scaleY(0.05)", opacity: "0.8" },
          "100%": { transform: "scaleY(0)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        slideInSide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutSide: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        slideInSideRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutSideRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        butterfly: {
          "0%": { transform: "translateX(0) translateY(0) rotate(0deg)" },
          "25%": { transform: "translateX(30px) translateY(-20px) rotate(15deg)" },
          "50%": { transform: "translateX(-20px) translateY(-40px) rotate(-10deg)" },
          "75%": { transform: "translateX(20px) translateY(-15px) rotate(5deg)" },
          "100%": { transform: "translateX(0) translateY(0) rotate(0deg)" },
        },
        bloomOut: {
          "0%": { transform: "scale(1) translateX(var(--bx,0)) translateY(var(--by,0))", opacity: "1" },
          "60%": { opacity: "0.8" },
          "100%": { transform: "scale(0) translateX(var(--bx,0)) translateY(var(--by,0))", opacity: "0" },
        },
        curtainLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        curtainRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        petalFall: {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "0.5" },
          "100%": {
            transform: "translateY(100vh) rotate(360deg)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
