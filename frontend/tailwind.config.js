/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EFF6FF",
          600: "#2563EB", // brand blue
          700: "#1D4ED8",
        },
        accent: {
          50:  "#ECFEFF",
          600: "#0D9488",
          700: "#0F766E",
        },
        success: { 600: "#059669" },
        warning: { 600: "#D97706" },
        danger:  { 600: "#E11D48" },
        slate: { 50: "#F8FAFC", 100:"#F1F5F9", 300:"#CBD5E1", 500:"#64748B", 700:"#334155", 900:"#0F172A" },
      },
      borderRadius: {
        xl2: "1rem", // optional alias
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
      },
    },
  },
  plugins: [],
};
