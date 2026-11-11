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
        "nuit-pelouse": "#0B2E22",
        "vert-projecteur": "#C8FF3D",
        "orange-sifflet": "#FF5B1F",
        "craie": "#F5F0E1",
        "encre": "#0A0F0D",
        "jaune-carton": "#FFD23F",
      },
      fontFamily: {
        display: ["var(--font-display)", "Anton", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "brutal": "4px 4px 0 #0A0F0D",
        "brutal-lg": "6px 6px 0 #0A0F0D",
        "brutal-xl": "8px 8px 0 #0A0F0D",
        "brutal-green": "4px 4px 0 #C8FF3D",
        "brutal-orange": "4px 4px 0 #FF5B1F",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bounce-ball": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-12px) scale(1.2)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "bounce-ball": "bounce-ball 0.5s ease-in-out",
        "count-up": "count-up 0.5s ease-out",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;

