import type { Config } from "tailwindcss";

// Direction visuelle provisoire (à ajuster au prototype gest-qbely-prototype.jsx
// quand il sera fourni) : registre papier, encre verte foncée sur fond ivoire.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // Sélecteur plutôt que media query : suit le bouton de bascule du site
  // public (components/public/theme-toggle.tsx), jamais la préférence
  // système seule - et n'affecte jamais l'application authentifiée, qui ne
  // pose jamais cet attribut.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Pilotées par des variables CSS (cf. app/globals.css) plutôt que des
        // hex fixes : permet au site public de basculer en sombre (attribut
        // data-theme="dark") sans toucher aux classes utilitaires existantes.
        ivoire: "rgb(var(--color-ivoire) / <alpha-value>)",
        encre: {
          DEFAULT: "rgb(var(--color-encre) / <alpha-value>)",
          light: "rgb(var(--color-encre-light) / <alpha-value>)",
        },
        surface: "rgb(var(--color-surface) / <alpha-value>)",
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
