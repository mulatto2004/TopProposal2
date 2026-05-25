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
        // TopProposal brand palette
        brand: {
          DEFAULT: "#1E3A5F",
          light: "#2A5080",
          dark: "#162d4a",
        },
        accent: {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#D1FAE5",
        },
        border: "var(--color-border)",
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        // Used in onboarding success progress bar
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        progress: "progress 1.8s ease-out forwards",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
