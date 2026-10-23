import type { Config } from "tailwindcss";

/**
 * Mark UI skin — indigo (the sign-in / dashboard blue-violet) on a light grey
 * canvas, with coral reserved for alerts.
 *
 * The app has years of hand-written `violet-*` / `purple-*` utility classes.
 * Rather than hunting every one down, the two palettes are re-mapped here so
 * the whole product re-skins from a single place:
 *   violet -> indigo    (#4F46E5 — same blue-violet the new sign-in page and
 *                        teacher dashboard use, so old pages and new pages
 *                        read as one product)
 *   purple -> coral     (#FF2442 — alerts, required tags)
 */
const brand = {
  50: "#eef2ff",
  100: "#e0e7ff",
  200: "#c7d2fe",
  300: "#a5b4fc",
  400: "#818cf8",
  500: "#6366f1",
  600: "#4f46e5",
  700: "#4338ca",
  800: "#3730a3",
  900: "#312e81",
  950: "#1e1b4b",
} as const;

const coral = {
  50: "#fff0f2",
  100: "#ffe0e5",
  200: "#ffc2cc",
  300: "#ff93a5",
  400: "#ff5c77",
  500: "#ff2442",
  600: "#f00b2c",
  700: "#c90a28",
  800: "#a50f2a",
  900: "#8b1328",
  950: "#4e0512",
} as const;

const mint = {
  50: "#e6fbf3",
  100: "#c8f5e4",
  200: "#95ebcc",
  300: "#5bdcae",
  400: "#26c692",
  500: "#12a978",
  600: "#0c8a62",
  700: "#0a6f50",
  800: "#0a5842",
  900: "#094837",
  950: "#04291f",
} as const;

const sunny = {
  50: "#fff8eb",
  100: "#ffefd0",
  200: "#ffdca3",
  300: "#ffc46b",
  400: "#ffac3d",
  500: "#ff9418",
  600: "#f07600",
  700: "#c25c05",
  800: "#9c490a",
  900: "#7e3c0d",
  950: "#451d02",
} as const;

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-green-100",
    "border-green-500",
    "text-green-700",
    "bg-red-100",
    "border-red-500",
    "text-red-700",
    "bg-yellow-100",
    "text-yellow-700",
    "border-yellow-500",
    {
      pattern: /delay-(100|200|300|500)/,
    },
    // The `mark-*` skin primitives are a design-system layer: keep them all
    // emitted so any page can opt in without touching this config.
    {
      pattern: /^mark-/,
    },
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Palette remap — see the note at the top of the file.
        violet: brand,
        purple: coral,
        coral,
        mint,
        sunny,
        brand,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Cards sit at 16px, inputs at 12px — the spec's radius scale.
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        pill: "999px",
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        "custom-shadow": "0px 1px 2px 0px #0000000D",
        // Soft and barely there — paper-like cards, no heavy admin chrome.
        card: "0 1px 2px rgb(16 24 40 / 0.04), 0 8px 24px -12px rgb(16 24 40 / 0.10)",
        soft: "0 2px 6px -1px rgb(79 70 229 / 0.10), 0 10px 28px -16px rgb(16 24 40 / 0.14)",
        lift: "0 12px 28px -14px rgb(79 70 229 / 0.32), 0 4px 12px -8px rgb(16 24 40 / 0.12)",
        glow: "0 0 0 4px rgb(79 70 229 / 0.16)",
        glowCoral: "0 0 0 4px rgb(255 36 66 / 0.16)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "brand-sheen":
          "linear-gradient(135deg, #6366f1 0%, #4f46e5 45%, #4338ca 100%)",
        "coral-sheen": "linear-gradient(135deg, #ff5c77 0%, #ff2442 100%)",
        "warm-halo":
          "radial-gradient(80rem 30rem at 50% -10rem, rgb(79 70 229 / 0.07), transparent 70%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pop: "pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-up": "fade-up 0.35s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
};
export default config;
