/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Manrope is the sole typeface — see DESIGN.md §3
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        // ── Core palette ──────────────────────────────────────────────
        primary: {
          DEFAULT: '#0f756d',  // Primary Forest Teal — buttons, active states, focus rings
          dark:    '#0d635c',  // Hover/pressed state for primary buttons
        },
        interactive: '#52b7ae', // Interactive Light Teal — hover bg, project card borders, drag-drop outlines. NEVER use as button fill.
        slate:       '#1a2332', // Deep Slate Navy — nav bar, login panel, primary headings
        'forest-dark': '#112120', // Forest Dark — dark overlays, login left-panel base
        canvas:      '#f7f6f3', // Warm Canvas — primary page background
        smoke:       '#f9fafb', // Smoke Gray — source snippet insets, recessed areas

        // ── Text ──────────────────────────────────────────────────────
        // (slate #1a2332 doubles as ink/heading color)
        muted:  '#5f6b7a', // Muted Slate — secondary text, metadata, inactive tabs
        stone:  '#9ca3af', // Stone Gray — placeholders, disabled, captions

        // ── Border ────────────────────────────────────────────────────
        border: '#d1d5db', // Default Border — inputs, cards, separators

        // ── Priority ──────────────────────────────────────────────────
        priority: {
          critical: '#dc2626',
          high:     '#ea580c',
          medium:   '#d97706',
          low:      '#9ca3af',
        },
      },

      // ── Border radius scale (ROUND_FOUR — see DESIGN.md §5) ────────
      borderRadius: {
        DEFAULT: '4px',   // Buttons, inputs, item cards
        lg:      '8px',   // Dropdowns, modals
        xl:      '12px',  // Page containers, form cards
        full:    '9999px', // Pills — status badges, label chips
        // sm and 2xl intentionally omitted to prevent drift
      },

      // ── Shadows: nearly flat — see DESIGN.md §5 ────────────────────
      boxShadow: {
        DEFAULT: '0 1px 2px rgba(0,0,0,0.05)', // Max allowed elevation
        card:    '0 1px 2px rgba(0,0,0,0.05)',
        none:    'none',
        // No shadow-md, shadow-lg, or higher — use color/border for depth
      },

      // ── Letter spacing for headings ─────────────────────────────────
      letterSpacing: {
        heading: '-0.01em',
      },

      // ── Background: grid texture ────────────────────────────────────
      backgroundImage: {
        'grid-texture': [
          'linear-gradient(rgba(15,117,109,0.05) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(15,117,109,0.05) 1px, transparent 1px)',
        ].join(', '),
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
