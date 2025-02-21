import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Templates/**/*.{js,ts,jsx,tsx,mdx}", // Add this line
  ],
  theme: {
    extend: {
      colors: {
        primary: "#809848",
        secondary: "#D9E0C8",
        newPrimary: "#2C451A",
        newSecondary: "#88A34A",
        onHover: "#465e0ee0",
        onBtnHover: "#A3B76F",
      },
      animation: {
        blink: "blink 1.5s steps(2, start) infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
    fontFamily: {
      sans: ["Poppins", "sans-serif"],
    },
  },
  plugins: [],
} satisfies Config;
