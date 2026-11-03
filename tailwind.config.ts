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
        // Warm Bento Fintech Palette
        surface: "#FAF9F4",
        "surface-dim": "#DBDAD5",
        "surface-bright": "#FAF9F4",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F4EF",
        "surface-container": "#EFEEE9",
        "surface-container-high": "#E9E8E3",
        "surface-container-highest": "#E3E3DE",
        "on-surface": "#1B1C19",
        "on-surface-variant": "#5A4136",
        "inverse-surface": "#18181B",
        "inverse-on-surface": "#F2F1EC",
        outline: "#ECEAE2",
        "outline-variant": "#E2BFB0",
        primary: "#A04100",
        "on-primary": "#FFFFFF",
        "primary-container": "#FF6B00",
        "primary-fixed": "#FFDBCC",
        "on-primary-fixed": "#351000",
        "on-primary-fixed-variant": "#7A3000",
        secondary: "#5F5E61",
        "secondary-container": "#E4E1E6",
        "secondary-fixed": "#E4E1E6",
        "on-secondary-fixed": "#1B1B1E",
        tertiary: "#674BB5",
        "tertiary-container": "#A387F6",
        "tertiary-fixed": "#E8DDFF",
        "on-tertiary-fixed": "#21005E",
        error: "#BA1A1A",
        "error-container": "#FFDAD6",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        bento: "0 1px 3px rgba(24, 24, 27, 0.03), 0 4px 12px rgba(24, 24, 27, 0.02)",
        bentoHover: "0 4px 20px rgba(24, 24, 27, 0.05), 0 2px 6px rgba(24, 24, 27, 0.02)",
      },
    },
  },
  plugins: [],
};
export default config;
