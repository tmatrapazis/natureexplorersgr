/** Shared Tailwind preset — Nature Explorers brand tokens (Organic-Modern). */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0c281c",         // Deep Forest Green (primary)
          sand: "#f0e3c7",         // Parchment / Sand (background/accent)
          "gold-accent": "#8B6914" // gold accent
        }
      },
      fontFamily: {
        heading: ["Century Gothic", "Century Gothic Pro", "Futura", "Trebuchet MS", "sans-serif"],
        body: ["system-ui", "-apple-system", "Inter", "sans-serif"]
      }
    }
  }
};
