import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#18181b",
        surface2: "#27272a",
        border: "#3f3f46",
        "border-subtle": "#27272a",
        text: "#fafafa",
        "text-2": "#a1a1aa",
        "text-3": "#71717a",
        accent: "#6366f1",
        "accent-hover": "#4f46e5",
        "accent-glow": "rgba(99,102,241,0.15)",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
