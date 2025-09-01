/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/ui/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gaming-cyan': 'hsl(193, 76%, 56%)',
        'gaming-purple': 'hsl(271, 81%, 56%)',
        'primary': 'hsl(193, 76%, 56%)',
        'destructive': 'hsl(0, 100%, 50%)',
        'secondary': 'hsl(271, 81%, 56%)',
        'border': 'hsl(220, 13%, 18%)',
        'muted-foreground': 'hsl(220, 13%, 50%)',
        'accent': 'hsl(220, 13%, 20%)',
        'input': 'hsl(220, 13%, 18%)',
        'ring': 'hsl(193, 76%, 56%)',
        'ring-offset-background': 'hsl(220, 13%, 8%)',
      },
    },
  },
  plugins: [],
};