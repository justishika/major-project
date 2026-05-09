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
        background: "#030712", // gray-950
        card: "rgba(17, 24, 39, 0.6)", // translucent gray-900
        cardHover: "rgba(31, 41, 55, 0.8)",
        primary: "#3b82f6", // blue-500
        primaryGlow: "rgba(59, 130, 246, 0.5)",
        quantum: "#ec4899", // pink-500
        hybrid: "#ef4444", // red-500
        hybridGlow: "rgba(239, 68, 68, 0.5)",
        classical: "#f59e0b", // amber-500
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(145deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.6) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
