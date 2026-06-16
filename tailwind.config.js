/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#F0F4FA",
          100: "#DCE6F4",
          200: "#B5CCE8",
          300: "#7EA5D3",
          400: "#4B7FB8",
          500: "#2F5F99",
          600: "#1F477A",
          700: "#0F2748",
          800: "#0A1A31",
          900: "#060F1F",
        },
        accent: {
          50: "#FFF3ED",
          100: "#FFE2D3",
          200: "#FFBE9A",
          300: "#FF945E",
          400: "#FF6B35",
          500: "#F5511B",
          600: "#D63A0E",
          700: "#AF2B0C",
          800: "#8C2310",
          900: "#721F11",
        },
        success: {
          50: "#ECFDF3",
          100: "#D1FAE0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        ink: {
          50: "#F5F7FA",
          100: "#E4E9F0",
          200: "#CBD3DE",
          300: "#98A5B7",
          400: "#64748B",
          500: "#475569",
          600: "#334155",
          700: "#1E293B",
          800: "#0F172A",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans CJK SC",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 39, 72, 0.06), 0 1px 2px rgba(15, 39, 72, 0.04)",
        cardHover: "0 8px 24px rgba(15, 39, 72, 0.10), 0 4px 8px rgba(15, 39, 72, 0.06)",
        tabBar: "0 -2px 12px rgba(15, 39, 72, 0.06)",
        topBar: "0 2px 12px rgba(15, 39, 72, 0.06)",
        float: "0 12px 32px rgba(255, 107, 53, 0.25), 0 4px 12px rgba(255, 107, 53, 0.15)",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        blink: "blink 1.2s ease-in-out infinite",
        slideInRight: "slideInRight 0.3s ease-out",
        slideInUp: "slideInUp 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0F2748 0%, #2F5F99 100%)",
        "gradient-accent": "linear-gradient(135deg, #FF6B35 0%, #F5511B 100%)",
        "gradient-hero": "linear-gradient(135deg, #0F2748 0%, #1F477A 50%, #FF6B35 150%)",
      },
    },
  },
  plugins: [],
};
