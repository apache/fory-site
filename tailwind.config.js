/** @type {import('tailwindcss').Config} */
const contentPaths = [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./blog/**/*.{md,mdx}",
  "./docs/**/*.{md,mdx}",
  "./versioned_docs/**/*.{md,mdx}",
  "./i18n/**/*.{js,jsx,ts,tsx,md,mdx}",
  "./node_modules/@docusaurus/theme-classic/**/*.{js,jsx,ts,tsx}",
  "./node_modules/@docusaurus/theme-search-algolia/**/*.{js,jsx,ts,tsx}",
];

module.exports = {
  content: contentPaths,
  purge: contentPaths,
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
