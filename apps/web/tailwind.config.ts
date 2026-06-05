import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-text)",
        muted: "var(--color-muted)",
        mist: "var(--color-bg)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        teal: "var(--color-accent)",
        coral: "var(--color-danger)"
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 28, 63, 0.10)",
        lift: "0 22px 60px rgba(15, 28, 63, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
