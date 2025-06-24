/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Custom fonts for gaming aesthetic (using system fonts for now)
      fontFamily: {
        'orbitron': ['system-ui', 'sans-serif'], // Gaming display font (system fallback)
        'inter': ['system-ui', 'sans-serif'], // Body text font (system fallback)
        'mono': ['SpaceMono-Regular', 'monospace'], // Technical content (available custom font)
      },
      
      // Cyber gaming color palette
      colors: {
        // Background colors
        'cyber-black': '#0a0a0a',
        'cyber-dark': '#1a1a1a',
        'cyber-gray': '#2a2a2a',
        
        // Accent colors (RGB Gaming Palette)
        'cyber-cyan': '#00ffff',
        'cyber-magenta': '#ff00ff', 
        'cyber-green': '#00ff41',
        'cyber-blue': '#0080ff',
        'cyber-orange': '#ff8000',
        'neon-red': '#ff0040',
        
        // Gaming context colors
        'gaming-victory': '#00ff41',
        'gaming-defeat': '#ff0040',
        'gaming-legendary': '#ffd700',
        'gaming-epic': '#a335ee',
        'gaming-rare': '#0070dd',
        'gaming-common': '#9d9d9d',
      },
      
      // Gaming-specific spacing
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      
      // Glow effects for gaming aesthetic
      boxShadow: {
        'glow-cyan': '0 0 10px rgba(0, 255, 255, 0.3)',
        'glow-magenta': '0 0 10px rgba(255, 0, 255, 0.3)',
        'glow-green': '0 0 10px rgba(0, 255, 65, 0.3)',
        'glow-blue': '0 0 10px rgba(0, 128, 255, 0.3)',
        'glow-orange': '0 0 10px rgba(255, 128, 0, 0.3)',
        'glow-red': '0 0 10px rgba(255, 0, 64, 0.3)',
        'inner-glow': 'inset 0 0 10px rgba(0, 255, 255, 0.2)',
      },
      
      // Gaming gradients
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
        'gradient-gaming': 'linear-gradient(135deg, #0080ff 0%, #00ff41 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff0040 0%, #ff8000 100%)',
        'gradient-legendary': 'linear-gradient(135deg, #ffd700 0%, #a335ee 100%)',
      },
      
      // Gaming animations
      animation: {
        'pulse-cyber': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'matrix-rain': 'matrixRain 20s linear infinite',
      },
      
      // Custom keyframes
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      
      // Gaming border styles
      borderWidth: {
        '3': '3px',
      },
      
      // Gaming backdrop blur
      backdropBlur: {
        'gaming': '8px',
      },
    },
  },
  plugins: [],
}
