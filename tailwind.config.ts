import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        skywash: "#eaf7ff",
        mint: "#dff8eb",
        peach: "#ffe8d3",
        sunshine: "#fff2b8",
        blueberry: "#2563eb",
        leaf: "#16a34a",
        amberSoft: "#f59e0b"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(30, 64, 175, 0.10)"
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        floatUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        pop: "pop 240ms ease-out",
        floatUp: "floatUp 280ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
