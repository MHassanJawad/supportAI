import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mist: "#f5f7fb",
        line: "#d8dee9",
        teal: "#0f766e",
        coral: "#c2410c"
      }
    }
  },
  plugins: []
};

export default config;
