import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        grey: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b8c1",
          400: "#91919f",
          500: "#737384",
          600: "#5d5d6c",
          700: "#4c4c58",
          800: "#41414b",
          900: "#393941",
          950: "#242428",
        },
        alert: {
          active: "#b45309",
          confirmed: "#047857",
          overridden: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
