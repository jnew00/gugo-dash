/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GUGO Desert Adventure Theme
        'gugo-brown': '#8B4513', // Rich brown from header
        'gugo-gold': '#DAA520', // Golden yellow from accents
        'gugo-cream': '#F5E6D3', // Light desert cream
        'gugo-orange': '#FF8C42', // Warm orange accent
        'gugo-sage': '#87A96B', // Desert sage green
        'gugo-tan': '#D2B48C', // Light tan
        'gugo-dark': '#2F1B14', // Dark brown
        'gugo-white': '#FEFEFE', // Off-white
        'gugo-blue': '#87CEEB', // Sky blue from buttons
      },
      fontFamily: {
        'gugo-header': ['Comic Sans MS', 'Marker Felt', 'cursive'], // Playful gaming font
        'gugo-body': ['Arial', 'Helvetica', 'sans-serif'], // Clean readable body
      },
      boxShadow: {
        'adventure': '2px 2px 4px rgba(139, 69, 19, 0.2)',
        'golden': '0 2px 6px rgba(218, 165, 32, 0.15)',
      },
      borderRadius: {
        'gugo': '12px', // Rounded corners like the website
      },
      backgroundImage: {
        'desert-gradient': 'linear-gradient(135deg, #F5E6D3 0%, #D2B48C 50%, #DAA520 100%)',
        'adventure-card': 'linear-gradient(145deg, #FEFEFE 0%, #F5E6D3 100%)',
      },
    },
  },
  plugins: [],
}