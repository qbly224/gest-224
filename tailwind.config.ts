import type { Config } from "tailwindcss";

// Direction visuelle provisoire (à ajuster au prototype gest-qbely-prototype.jsx
// quand il sera fourni) : registre papier, encre verte foncée sur fond ivoire.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivoire: "#f6f1e7",
        encre: {
          DEFAULT: "#1f3d2c",
          light: "#2d5741",
        },
      },
      fontFamily: {
        titre: ["var(--font-lora)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
