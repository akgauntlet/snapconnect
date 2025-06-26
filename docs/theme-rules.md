# Theme Rules - SnapConnect

This document defines the visual theme system for SnapConnect, establishing a **professional cyber/gaming aesthetic** with consistent colors, typography, spacing, and styling patterns. All design decisions should reference this guide to maintain visual coherence across the platform.

## **Key Principles:**

- **Primary Colors Only**: Cyan (#00ffff) and White (#ffffff) for 80% of the interface
- **Strategic Secondary**: Green (#00ff00) for success, Red (#ff0000) for warnings/errors
- **Smooth Over Flashy**: Subtle animations and effects, avoiding visual chaos
- **Professional Polish**: AAA game quality design that's sophisticated, not amateur
- **Purposeful Color**: Every color choice serves a functional purpose

---

## Color Palette

### **Refined Color System (Professional Gaming)**

```css
/* Core Background Colors */
--background-primary: #0a0a0a /* Deep black - main background */
  --background-secondary: #1a1a1a /* Dark gray - elevated surfaces */
  --background-tertiary: #2a2a2a /* Medium gray - cards/panels */
  /* Primary Colors (80% of design) */ --primary-cyan: #00ffff
  /* Cyan - primary brand & interactions */ --primary-white: #ffffff
  /* White - primary text & elements */ /* Secondary Colors (20% of design) */
  --secondary-green: #00ff00 /* Green - success states & positive actions */
  --secondary-red: #ff0000 /* Red - warnings & critical actions */
  /* Supporting Grays */ --text-secondary: #a0a0a0
  /* Light gray - secondary text */ --text-tertiary: #707070
  /* Medium gray - tertiary text */ --text-disabled: #404040
  /* Dark gray - disabled text */ --border-subtle: rgba(255, 255, 255, 0.1)
  /* Subtle borders */ --border-accent: rgba(0, 255, 255, 0.3)
  /* Accent borders */;
```

### **Color Usage Guidelines**

#### **Primary Color Application (Cyan + White)**

- **Cyan** (`#00ffff`): Brand elements, primary buttons, active states, navigation highlights
- **White** (`#ffffff`): Primary text, titles, icons, clean typography
- **Usage Rule**: 80% of design should use only cyan and white for main elements

#### **Secondary Color Application (Green + Red)**

- **Green** (`#00ff00`): Success messages, positive stats, online indicators, achievements
- **Red** (`#ff0000`): Error states, warnings, delete actions, critical alerts
- **Usage Rule**: 20% of design uses green/red strategically for functional states

#### **Background Hierarchy**

- **Primary Background** (`#0a0a0a`): Main app background, camera interface
- **Secondary Background** (`#1a1a1a`): Cards, modals, elevated surfaces
- **Tertiary Background** (`#2a2a2a`): Buttons, input fields, nested components

#### **Simplified Gradient Usage**

- **Cyan Gradients**: Subtle cyan-to-transparent only for elegant effects
- **No RGB Rainbows**: Avoid multi-color gradients that create visual chaos
- **Single Color Focus**: Each element should have one primary color identity

### **Accessibility Considerations**

- **Contrast Ratios**: All text combinations meet WCAG 4.5:1 minimum
- **Color Blindness**: Never rely solely on color; use icons and text labels
- **Neon Balance**: Bright colors used sparingly to avoid eye strain
- **Dark Optimization**: Primary theme designed for low-light usage

---

## Typography

### **Font Families**

#### **Primary Font: Orbitron**

- **Purpose**: Headers, navigation, brand elements, gaming UI components
- **Weights Available**: Light (300), Regular (400), Medium (500), Bold (700), Black (900)
- **Character**: Futuristic, gaming-inspired, high-tech aesthetic
- **Usage**: Sparingly for maximum impact, excellent readability not guaranteed

#### **Secondary Font: Inter**

- **Purpose**: Body text, descriptions, form inputs, readable content
- **Weights Available**: Regular (400), Medium (500), SemiBold (600), Bold (700)
- **Character**: Clean, modern, highly readable
- **Usage**: Primary text font for optimal readability

#### **Tertiary Font: JetBrains Mono**

- **Purpose**: Usernames, codes, timestamps, technical information
- **Weights Available**: Regular (400), Medium (500), Bold (700)
- **Character**: Monospace, developer-friendly, gaming console aesthetic
- **Usage**: Data that benefits from fixed-width formatting

### **Typography Scale**

```css
/* Display Text (Orbitron) */
--text-display-large: 32px/40px /* App title, hero text */
  --text-display-medium: 28px/36px /* Section headers */
  --text-display-small: 24px/32px /* Page titles */
  /* Heading Text (Orbitron) */ --text-heading-large: 20px/28px
  /* Card titles, modal headers */ --text-heading-medium: 18px/26px
  /* Component headers */ --text-heading-small: 16px/24px
  /* List headers, labels */ /* Body Text (Inter) */
  --text-body-large: 16px/24px /* Primary readable content */
  --text-body-medium: 14px/22px /* Secondary content */
  --text-body-small: 12px/18px /* Captions, meta information */
  /* Technical Text (JetBrains Mono) */ --text-mono-medium: 14px/20px
  /* Usernames, timestamps */ --text-mono-small: 12px/16px
  /* Codes, technical details */;
```

### **Typography Usage Rules**

#### **Orbitron (Gaming Headers)**

- **Maximum Usage**: 20% of visible text should use Orbitron
- **Best For**: App name, section titles, gaming achievements, navigation
- **Avoid For**: Body text, long descriptions, form inputs
- **Color Pairing**: Works best with cyan, magenta, and white colors

#### **Inter (Readable Content)**

- **Primary Usage**: 70% of text content should use Inter
- **Best For**: Messages, descriptions, settings, body content
- **Weight Guidelines**: Regular (400) for body, Medium (500) for emphasis
- **Line Height**: 1.5x font size for optimal readability

#### **JetBrains Mono (Technical Content)**

- **Specific Usage**: 10% of text for technical/gaming data
- **Best For**: Usernames, game IDs, timestamps, scores
- **Styling**: Often paired with gaming accent colors
- **Spacing**: Extra letter-spacing (0.5px) for enhanced readability

---

## Spacing & Layout

### **Spacing Scale**

```css
/* Base spacing unit: 4px */
--space-1: 4px /* xs - tight spacing */ --space-2: 8px /* sm - close elements */
  --space-3: 12px /* md - default spacing */ --space-4: 16px
  /* lg - component spacing */ --space-5: 20px /* xl - section spacing */
  --space-6: 24px /* 2xl - major spacing */ --space-8: 32px
  /* 3xl - large sections */ --space-10: 40px /* 4xl - page sections */
  --space-12: 48px /* 5xl - major layouts */ --space-16: 64px
  /* 6xl - hero sections */;
```

### **Layout Guidelines**

#### **Container Spacing**

- **Screen Edges**: 16px minimum padding from screen edges
- **Safe Areas**: Additional padding for device notches and rounded corners
- **Card Margins**: 16px between cards, 24px for featured content
- **Section Spacing**: 32px between major page sections

#### **Component Spacing**

- **Internal Padding**: 12px minimum for touchable components
- **Button Padding**: 16px horizontal, 12px vertical minimum
- **Form Elements**: 16px between form fields
- **List Items**: 12px vertical padding, 16px horizontal

#### **Gaming UI Considerations**

- **Larger Touch Targets**: 48dp minimum for gaming audience
- **Thumb Zones**: Keep primary actions within 120px of screen bottom
- **Visual Breathing Room**: Extra spacing around RGB/neon elements
- **Overlay Spacing**: Minimal padding for camera overlays

---

## Component Styling

### **Buttons**

#### **Primary Button (Clean Cyan)**

```css
/* Primary Clean Button */
background: #00ffff;
color: #000000;
font-family: Inter;
font-weight: 700;
border-radius: 8px;
padding: 16px 24px;
box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2);
transition: all 200ms ease-out;

/* Hover/Active State */
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3);
```

#### **Secondary Button (Subtle Cyan)**

```css
/* Secondary Clean Button */
background: rgba(0, 255, 255, 0.05);
border: 1px solid rgba(0, 255, 255, 0.3);
color: #00ffff;
font-family: Inter;
font-weight: 500;
border-radius: 8px;
padding: 12px 20px;
transition: all 200ms ease-out;

/* Hover/Active State */
background: rgba(0, 255, 255, 0.1);
border-color: rgba(0, 255, 255, 0.5);
```

#### **Success Button (Clean Green)**

```css
/* Success/Positive Action Button */
background: #00ff00;
color: #000000;
font-family: Inter;
font-weight: 600;
border-radius: 8px;
padding: 12px 20px;
box-shadow: 0 2px 8px rgba(0, 255, 0, 0.2);
```

#### **Danger Button (Clean Red)**

```css
/* Danger/Delete Button */
background: #ff0000;
color: #ffffff;
font-family: Inter;
font-weight: 600;
border-radius: 8px;
padding: 12px 20px;
box-shadow: 0 2px 8px rgba(255, 0, 0, 0.2);
```

### **Cards & Panels**

#### **Content Card**

```css
background: #1a1a1a;
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
padding: 16px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
```

#### **Gaming Achievement Card**

```css
background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
border: 1px solid #00ff41;
border-radius: 12px;
padding: 20px;
box-shadow: 0 0 20px rgba(0, 255, 65, 0.1);
position: relative;

/* RGB Accent Border */
&::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  background: linear-gradient(45deg, #00ffff, #ff00ff, #00ff41);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```

### **Form Elements**

#### **Input Fields**

```css
/* Standard Input */
background: #2a2a2a;
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 8px;
padding: 12px 16px;
color: #ffffff;
font-family: Inter;
font-size: 16px;
transition: border-color 200ms ease-out;

/* Focus State */
border-color: #00ffff;
box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
outline: none;
```

#### **Gaming Username Input**

```css
/* Gaming-specific styling */
background: #1a1a1a;
border: 1px solid #00ff41;
color: #00ff41;
font-family: JetBrains Mono;
text-transform: lowercase;
letter-spacing: 0.5px;
```

### **Navigation Elements**

#### **Bottom Tab Bar**

```css
background: rgba(26, 26, 26, 0.95);
backdrop-filter: blur(20px);
border-top: 1px solid rgba(255, 255, 255, 0.1);
height: 80px;
padding-bottom: 20px; /* Safe area consideration */
```

#### **Active Tab Indicator**

```css
background: linear-gradient(45deg, #00ffff, #ff00ff);
height: 3px;
border-radius: 2px;
width: 24px;
position: absolute;
top: -1px;
```

---

## Visual Effects

### **Subtle Visual Effects**

#### **Clean Glow Effects**

```css
/* Subtle Cyan Glow (Primary) */
box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);

/* Soft White Glow (Text) */
text-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);

/* Success Glow (Green) */
box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);

/* Warning Glow (Red) */
box-shadow: 0 0 8px rgba(255, 0, 0, 0.2);
```

#### **Smooth Animations**

```css
@keyframes gentlepulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.smooth-pulse {
  animation: gentlepulse 3s ease-in-out infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}
```

### **Professional UI Effects**

#### **Clean Border Animations**

```css
@keyframes borderGlow {
  0%,
  100% {
    border-color: rgba(0, 255, 255, 0.3);
  }
  50% {
    border-color: rgba(0, 255, 255, 0.6);
  }
}

.animated-border {
  border: 1px solid rgba(0, 255, 255, 0.3);
  animation: borderGlow 2s ease-in-out infinite;
}
```

#### **Smooth Transitions**

```css
/* Standard Transition */
.smooth-transition {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover Effects */
.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 255, 0.2);
  transition: all 200ms ease-out;
}
```

### **Particle Effects**

- **Success States**: Green matrix-style falling particles
- **Achievement Unlocks**: Exploding star particles with RGB colors
- **Loading States**: Floating geometric shapes with neon outlines
- **Transition Effects**: Glitch-style pixel displacement

---

## Dark Theme Implementation

### **Base Theme Configuration**

```javascript
// NativeWind/Tailwind configuration
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clean cyber gaming colors
        "bg-primary": "#0a0a0a",
        "bg-secondary": "#1a1a1a",
        "bg-tertiary": "#2a2a2a",
        "primary-cyan": "#00ffff",
        "primary-white": "#ffffff",
        "secondary-green": "#00ff00",
        "secondary-red": "#ff0000",
        "text-secondary": "#a0a0a0",
        "text-tertiary": "#707070",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        jetbrains: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        // 4px base spacing scale
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      animation: {
        "pulse-cyber": "cyberpulse 2s ease-in-out infinite",
        scanline: "scanline 2s ease-in-out infinite",
        "rgb-border": "rgbrotate 3s ease infinite",
      },
    },
  },
  plugins: [],
};
```

### **Theme Context Implementation**

```javascript
// Theme provider for consistent theming
export const CyberTheme = {
  colors: {
    background: {
      primary: "#0a0a0a",
      secondary: "#1a1a1a",
      tertiary: "#2a2a2a",
    },
    primary: {
      cyan: "#00ffff",
      white: "#ffffff",
    },
    secondary: {
      green: "#00ff00",
      red: "#ff0000",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a0a0a0",
      tertiary: "#707070",
      disabled: "#404040",
    },
    functional: {
      success: "#00ff00",
      error: "#ff0000",
      info: "#00ffff",
    },
  },
  typography: {
    fonts: {
      display: "Orbitron",
      body: "Inter",
      mono: "JetBrains Mono",
    },
    sizes: {
      display: { large: 32, medium: 28, small: 24 },
      heading: { large: 20, medium: 18, small: 16 },
      body: { large: 16, medium: 14, small: 12 },
      mono: { medium: 14, small: 12 },
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,
    xxxxxxl: 64,
  },
  effects: {
    glowCyan: "0 0 10px rgba(0, 255, 255, 0.3)",
    glowMagenta: "0 0 10px rgba(255, 0, 255, 0.3)",
    glowGreen: "0 0 10px rgba(0, 255, 65, 0.3)",
  },
};
```

---

## Implementation Examples

### **React Native Component Examples**

#### **Gaming Button Component**

```javascript
// CyberButton.tsx
import { TouchableOpacity, Text } from "react-native";

const CyberButton = ({ title, variant = "primary", onPress, ...props }) => {
  const baseClasses = "px-6 py-4 rounded-lg font-orbitron font-semibold";

  const variants = {
    primary: "bg-gradient-to-r from-cyber-cyan to-cyber-magenta text-black",
    secondary: "bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan",
    danger: "bg-neon-red text-white",
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variants[variant]}`}
      onPress={onPress}
      {...props}
    >
      <Text className="text-center font-orbitron font-semibold">{title}</Text>
    </TouchableOpacity>
  );
};
```

#### **Gaming Card Component**

```javascript
// GameCard.tsx
const GameCard = ({ children, glowing = false, ...props }) => {
  const baseClasses = "bg-bg-secondary border border-white/10 rounded-xl p-4";
  const glowClasses = glowing ? "border-matrix-green shadow-glow-green" : "";

  return (
    <View className={`${baseClasses} ${glowClasses}`} {...props}>
      {children}
    </View>
  );
};
```

### **Usage Guidelines**

#### **Do's**

- ✅ Use RGB gradients sparingly for maximum impact
- ✅ Combine Orbitron with gaming UI elements only
- ✅ Maintain high contrast ratios for accessibility
- ✅ Use consistent spacing from the defined scale
- ✅ Apply glow effects to interactive elements

#### **Don'ts**

- ❌ Overuse bright neon colors causing eye strain
- ❌ Use Orbitron for body text or long content
- ❌ Ignore accessibility requirements for contrast
- ❌ Create custom spacing outside the defined scale
- ❌ Apply multiple conflicting glow effects

---

This theme system provides the foundation for a cohesive, gaming-focused visual identity that enhances user experience while maintaining accessibility and performance standards across SnapConnect's interface.
