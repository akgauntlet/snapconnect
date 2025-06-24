# Project Rules - SnapConnect

This document establishes the comprehensive coding standards, file structure, and development guidelines for SnapConnect - a gaming-focused ephemeral messaging platform with RAG-enhanced AI capabilities. These rules ensure maintainability, scalability, and optimal compatibility with modern AI development tools.

---

## AI-First Development Principles

### **Core Philosophy**
SnapConnect is built as an **AI-first codebase**, meaning every architectural decision prioritizes compatibility with AI development tools, code clarity, and intelligent automation.

### **AI Compatibility Requirements**
- **File Size Limit**: Maximum 500 lines per file for optimal AI tool processing
- **Modular Architecture**: Each file should have a single, clear responsibility
- **Descriptive Naming**: File and function names should be self-documenting
- **Comprehensive Documentation**: Every file and function must be properly documented
- **Predictable Structure**: Consistent patterns that AI tools can easily understand and extend

### **Intelligent Development Goals**
- **RAG Integration**: Code structure should support easy integration of retrieval-augmented generation features
- **Context Awareness**: Components should be designed to adapt based on gaming context and user behavior
- **Scalable Intelligence**: Architecture should support expanding AI capabilities without major refactoring
- **Data-Driven Design**: Code should facilitate easy collection and utilization of user interaction data

---

## Project Directory Structure

### **Root Level Organization**
```
snapconnect/
├── src/                          # Main application source code
├── assets/                       # Static assets (images, fonts, icons)
├── docs/                         # Project documentation
├── scripts/                      # Build and utility scripts
├── __tests__/                    # Global test configurations
├── App.js                        # Root application component
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # NativeWind/Tailwind configuration
├── babel.config.js               # Babel transpilation config
├── metro.config.js               # Metro bundler configuration
└── firebase.json                 # Firebase services configuration
```

### **Source Code Structure (`src/`)**
```
src/
├── components/                   # Reusable UI components
│   ├── common/                   # Generic components (buttons, inputs, cards)
│   ├── gaming/                   # Gaming-specific components
│   ├── camera/                   # Camera and media components
│   ├── messaging/                # Chat and messaging components
│   ├── navigation/               # Navigation components
│   └── ai/                       # AI-enhanced components
├── screens/                      # Full-screen components
│   ├── auth/                     # Authentication screens
│   ├── camera/                   # Camera and capture screens
│   ├── messaging/                # Chat and conversation screens
│   ├── profile/                  # User profile screens
│   ├── stories/                  # Stories and feed screens
│   └── gaming/                   # Gaming-specific screens
├── services/                     # External service integrations
│   ├── firebase/                 # Firebase service modules
│   ├── ai/                       # AI service integrations (OpenAI, Pinecone)
│   ├── camera/                   # Camera service utilities
│   ├── storage/                  # File storage services
│   └── analytics/                # Analytics and tracking
├── stores/                       # Zustand state management
│   ├── auth.js                   # Authentication state
│   ├── messages.js               # Messaging state
│   ├── camera.js                 # Camera state
│   ├── theme.js                  # Theme and UI state
│   ├── gaming.js                 # Gaming-specific state
│   └── ai.js                     # AI context and preferences
├── hooks/                        # Custom React hooks
│   ├── auth/                     # Authentication hooks
│   ├── camera/                   # Camera functionality hooks
│   ├── gaming/                   # Gaming context hooks
│   ├── ai/                       # AI-enhanced feature hooks
│   └── common/                   # General utility hooks
├── utils/                        # Utility functions and helpers
│   ├── constants.js              # App-wide constants
│   ├── theme.js                  # Theme utilities and tokens
│   ├── validation.js             # Input validation utilities
│   ├── gaming.js                 # Gaming-specific utilities
│   ├── ai.js                     # AI helper functions
│   └── performance.js            # Performance optimization utilities
├── types/                        # TypeScript type definitions
│   ├── auth.ts                   # Authentication types
│   ├── messaging.ts              # Messaging types
│   ├── gaming.ts                 # Gaming-specific types
│   ├── ai.ts                     # AI feature types
│   └── common.ts                 # Shared types
├── config/                       # Configuration files
│   ├── firebase.js               # Firebase configuration
│   ├── ai.js                     # AI service configurations
│   ├── theme.js                  # Theme configuration
│   └── constants.js              # Environment-specific constants
└── navigation/                   # Navigation configuration
    ├── AppNavigator.js           # Main navigation stack
    ├── AuthNavigator.js          # Authentication flow navigation
    ├── TabNavigator.js           # Bottom tab navigation
    └── StackNavigators.js        # Screen stack configurations
```

### **Assets Organization (`assets/`)**
```
assets/
├── images/                       # Image assets
│   ├── icons/                    # App icons and UI icons
│   ├── gaming/                   # Gaming-themed graphics
│   ├── filters/                  # AR filter assets
│   └── branding/                 # Brand logos and graphics
├── fonts/                        # Custom font files
│   ├── Orbitron/                 # Gaming display font
│   ├── Inter/                    # Body text font
│   └── JetBrainsMono/            # Monospace font
├── animations/                   # Animation files (Lottie, etc.)
│   ├── loading/                  # Loading animations
│   ├── success/                  # Success state animations
│   └── gaming/                   # Gaming-themed animations
└── sounds/                       # Audio assets
    ├── notifications/            # Notification sounds
    ├── ui/                       # UI feedback sounds
    └── gaming/                   # Gaming-themed audio
```

---

## File Naming Conventions

### **Component Files**
```javascript
// Format: PascalCase with descriptive, hierarchical naming
CyberButton.jsx                   // Gaming-themed button component
MessageBubble.jsx                 // Chat message display component
CameraOverlay.jsx                 // Camera interface overlay
GamingAchievementCard.jsx         // Gaming achievement display
AIContentSuggestion.jsx           // AI-powered content suggestions
```

### **Screen Files**
```javascript
// Format: PascalCase ending with "Screen"
LoginScreen.jsx                   // Authentication login
CameraScreen.jsx                  // Main camera interface
ChatScreen.jsx                    // Individual conversation
ProfileScreen.jsx                 // User profile display
StoriesScreen.jsx                 // Stories feed display
GamingDashboardScreen.jsx         // Gaming-specific dashboard
```

### **Service Files**
```javascript
// Format: camelCase describing the service
authService.js                    // Authentication operations
firebaseService.js               // Firebase integrations
aiService.js                     // AI service integrations
cameraService.js                 // Camera functionality
gamingService.js                 // Gaming platform integrations
```

### **Hook Files**
```javascript
// Format: camelCase starting with "use"
useAuth.js                       // Authentication state and operations
useCamera.js                     // Camera functionality
useGamingContext.js              // Gaming state and preferences
useAIEnhancement.js              // AI-powered features
useTheme.js                      // Theme and styling utilities
```

### **Utility Files**
```javascript
// Format: camelCase describing purpose
themeUtils.js                    // Theme-related utilities
validationUtils.js               // Input validation helpers
gamingUtils.js                   // Gaming-specific utilities
aiUtils.js                       // AI helper functions
performanceUtils.js              // Performance optimization
```

### **Store Files**
```javascript
// Format: camelCase describing state domain
authStore.js                     // Authentication state
messagesStore.js                 // Messaging state
cameraStore.js                   // Camera state
gamingStore.js                   // Gaming preferences and state
aiStore.js                       // AI context and preferences
```

---

## File Documentation Standards

### **File Header Template**
Every file must begin with a comprehensive header comment:

```javascript
/**
 * @file CyberButton.jsx
 * @description Gaming-themed button component with RGB gradient styling and neon glow effects.
 * Supports multiple variants (primary, secondary, danger) and integrates with the cyber gaming aesthetic.
 * 
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react-native: TouchableOpacity, Text
 * - nativewind: Styling utilities
 * - @/utils/theme: Theme constants
 * 
 * @usage
 * import CyberButton from '@/components/common/CyberButton';
 * <CyberButton title="Join Game" variant="primary" onPress={handlePress} />
 * 
 * @testing
 * - Unit tests: __tests__/CyberButton.test.js
 * - Integration tests: Screen component tests
 * 
 * @ai_context
 * This component is designed for gaming contexts and should adapt based on user gaming preferences.
 * It integrates with the gaming theme system and supports AI-driven customization.
 */
```

### **Function Documentation Template**
All functions must use JSDoc/TSDoc format:

```javascript
/**
 * Handles user authentication with gaming platform integration
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} options - Additional authentication options
 * @param {boolean} options.rememberMe - Whether to persist session
 * @param {string} options.gamingPlatform - Gaming platform for integration
 * 
 * @returns {Promise<AuthResult>} Authentication result with user data
 * 
 * @throws {AuthError} When authentication fails
 * @throws {NetworkError} When network request fails
 * 
 * @example
 * const result = await authenticateUser('user@example.com', 'password123', {
 *   rememberMe: true,
 *   gamingPlatform: 'steam'
 * });
 * 
 * @ai_enhancement
 * This function supports AI-powered user preference detection and gaming platform
 * integration for personalized onboarding experiences.
 */
async function authenticateUser(email, password, options = {}) {
  // Implementation
}
```

### **Component Documentation Template**
React components require additional documentation:

```javascript
/**
 * @component CyberButton
 * @description Gaming-themed button with customizable variants and AI-enhanced interactions
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Button text content
 * @param {'primary'|'secondary'|'danger'} props.variant - Button style variant
 * @param {Function} props.onPress - Click/tap handler function
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether to show loading state
 * @param {Object} props.aiContext - AI context for personalization
 * 
 * @returns {ReactElement} Rendered button component
 * 
 * @accessibility
 * - Supports screen readers with proper labels
 * - Maintains minimum 48dp touch target
 * - High contrast mode compatible
 * 
 * @performance
 * - Uses React.memo for re-render optimization
 * - Implements haptic feedback efficiently
 * - GPU-accelerated animations
 * 
 * @ai_integration
 * - Adapts styling based on user gaming preferences
 * - Supports AI-driven A/B testing variants
 * - Integrates with usage analytics for optimization
 */
```

---

## Code Organization Principles

### **Component Structure**
Every component should follow this consistent structure:

```javascript
// 1. File header documentation
/**
 * @file ComponentName.jsx
 * ...
 */

// 2. Imports (grouped and ordered)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Custom hooks
import { useAuth, useTheme } from '@/hooks';

// Services
import { aiService, gamingService } from '@/services';

// Utils
import { themeUtils, validationUtils } from '@/utils';

// Types
import type { ComponentProps, AIContext } from '@/types';

// 3. Type definitions (if not in separate file)
interface Props {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
  aiContext?: AIContext;
}

// 4. Constants and default values
const DEFAULT_VARIANT = 'primary';
const ANIMATION_DURATION = 200;

// 5. Main component function
const ComponentName: React.FC<Props> = ({
  title,
  variant = DEFAULT_VARIANT,
  onPress,
  aiContext,
}) => {
  // 6. Hooks (state, effects, custom hooks)
  const [isPressed, setIsPressed] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();

  // 7. Event handlers
  const handlePress = useCallback(() => {
    setIsPressed(true);
    onPress();
    // AI analytics
    aiService.trackUserInteraction('button_press', { variant, title });
  }, [onPress, variant, title]);

  // 8. Effects
  useEffect(() => {
    if (aiContext) {
      // AI-enhanced personalization
      aiService.personalizeComponent('button', aiContext);
    }
  }, [aiContext]);

  // 9. Derived values and computations
  const buttonStyles = useMemo(() => 
    themeUtils.getButtonStyles(variant, theme), 
    [variant, theme]
  );

  // 10. Render
  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <Text style={theme.typography.button}>{title}</Text>
    </TouchableOpacity>
  );
};

// 11. Default export
export default React.memo(ComponentName);

// 12. Named exports (if needed)
export type { Props as ComponentNameProps };
```

### **Service Module Structure**
Service modules should follow this pattern:

```javascript
/**
 * @file aiService.js
 * @description AI service integration for content generation and personalization
 */

// 1. File header and imports
import { openai } from '@/config/ai';
import { gamingUtils } from '@/utils';
import type { AIRequest, AIResponse, GamingContext } from '@/types';

// 2. Constants and configuration
const AI_CONFIG = {
  maxTokens: 150,
  temperature: 0.7,
  model: 'gpt-4-turbo-preview',
};

// 3. Private utility functions
/**
 * Formats gaming context for AI processing
 */
const formatGamingContext = (context: GamingContext): string => {
  // Implementation
};

// 4. Main service class/object
class AIService {
  /**
   * Generates gaming-focused content suggestions
   */
  async generateContentSuggestion(
    userContext: GamingContext,
    contentType: 'caption' | 'hashtag' | 'story'
  ): Promise<AIResponse> {
    // Implementation
  }

  /**
   * Personalizes component based on gaming preferences
   */
  async personalizeComponent(
    componentType: string,
    aiContext: AIContext
  ): Promise<void> {
    // Implementation
  }
}

// 5. Export singleton instance
export const aiService = new AIService();
export default aiService;
```

---

## Styling Organization

### **Theme Configuration Structure**
Following the cyber gaming aesthetic defined in `theme-rules.md`:

```javascript
/**
 * @file theme.js
 * @description Cyber gaming theme configuration with RGB color palette and gaming typography
 */

export const CyberTheme = {
  // Color system from theme-rules.md
  colors: {
    background: {
      primary: '#0a0a0a',      // Deep black
      secondary: '#1a1a1a',    // Dark gray
      tertiary: '#2a2a2a',     // Medium gray
    },
    accent: {
      cyan: '#00ffff',         // Primary brand color
      magenta: '#ff00ff',      // Secondary brand color
      green: '#00ff41',        // Matrix green
      blue: '#0080ff',         // Electric blue
      orange: '#ff8000',       // Gaming orange
    },
    // ... rest of color system
  },

  // Typography system
  typography: {
    fonts: {
      display: 'Orbitron',      // Gaming headers (max 20% usage)
      body: 'Inter',            // Readable content (70% usage)
      mono: 'JetBrains Mono',   // Technical content (10% usage)
    },
    // ... rest of typography system
  },

  // Spacing scale (4px base unit)
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
    xxl: 24, xxxl: 32, xxxxl: 40, xxxxxl: 48, xxxxxxl: 64,
  },

  // Gaming effects
  effects: {
    glowCyan: '0 0 10px rgba(0, 255, 255, 0.3)',
    glowMagenta: '0 0 10px rgba(255, 0, 255, 0.3)',
    glowGreen: '0 0 10px rgba(0, 255, 65, 0.3)',
  },
};
```

### **Component Styling Patterns**
Use NativeWind with custom theme integration:

```javascript
// Base component classes
const baseClasses = 'px-4 py-3 rounded-lg font-inter';

// Variant-specific classes
const variants = {
  primary: 'bg-gradient-to-r from-cyber-cyan to-cyber-magenta text-black font-orbitron',
  secondary: 'bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan',
  danger: 'bg-neon-red text-white',
};

// Gaming-specific modifiers
const gamingClasses = 'shadow-glow-cyan animate-pulse-cyber';
```

---

## State Management Guidelines

### **Zustand Store Organization**
Each store should be focused and well-documented:

```javascript
/**
 * @file authStore.js
 * @description Authentication state management with gaming platform integration
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, gamingService } from '@/services';
import type { User, GamingProfile, AuthState } from '@/types';

interface AuthState {
  // State properties
  user: User | null;
  gamingProfile: GamingProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateGamingProfile: (profile: Partial<GamingProfile>) => void;
  clearError: () => void;
}

/**
 * Authentication store with gaming integration and AI personalization
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        gamingProfile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions with comprehensive error handling
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const result = await authService.authenticate(email, password);
            const gamingProfile = await gamingService.getUserProfile(result.user.id);
            
            set({
              user: result.user,
              gamingProfile,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
            });
          }
        },

        logout: async () => {
          await authService.logout();
          set({
            user: null,
            gamingProfile: null,
            isAuthenticated: false,
            error: null,
          });
        },

        updateGamingProfile: (profileUpdate) => {
          const currentProfile = get().gamingProfile;
          if (currentProfile) {
            set({
              gamingProfile: { ...currentProfile, ...profileUpdate },
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          gamingProfile: state.gamingProfile,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
```

---

## Testing Organization

### **Test File Structure**
```
__tests__/
├── components/                   # Component tests
│   ├── common/
│   │   ├── CyberButton.test.js
│   │   └── GameCard.test.js
│   └── gaming/
│       ├── AchievementCard.test.js
│       └── GamingDashboard.test.js
├── screens/                      # Screen integration tests
│   ├── auth/
│   │   └── LoginScreen.test.js
│   └── camera/
│       └── CameraScreen.test.js
├── services/                     # Service tests
│   ├── aiService.test.js
│   ├── authService.test.js
│   └── gamingService.test.js
└── integration/                  # End-to-end tests
    ├── authentication.test.js
    ├── messaging.test.js
    └── gaming-features.test.js
```

### **Test Documentation Template**
```javascript
/**
 * @file CyberButton.test.js
 * @description Comprehensive tests for CyberButton component including gaming features and AI integration
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CyberButton } from '@/components/common';
import { aiService } from '@/services';

// Mock dependencies
jest.mock('@/services/aiService');

describe('CyberButton Component', () => {
  /**
   * Test basic rendering functionality
   */
  describe('Rendering', () => {
    it('renders with primary variant styling', () => {
      // Test implementation
    });

    it('applies gaming theme correctly', () => {
      // Test implementation
    });
  });

  /**
   * Test AI integration features
   */
  describe('AI Integration', () => {
    it('tracks user interactions with AI service', async () => {
      // Test implementation
    });

    it('adapts styling based on AI context', () => {
      // Test implementation
    });
  });
});
```

---

## Performance & Security Guidelines

### **Performance Rules**
- **60fps Target**: All animations must maintain 60fps during gaming
- **Memory Management**: Proper cleanup of camera resources and event listeners
- **Bundle Optimization**: Code splitting for gaming features and AI components
- **AI Caching**: Cache AI responses and user preferences efficiently

### **Security Standards**
- **Environment Variables**: Store all API keys in environment-specific configs
- **Input Validation**: Validate all user inputs, especially for AI processing
- **Data Encryption**: Encrypt gaming preferences and AI personalization data
- **Privacy Compliance**: Implement proper consent flows for AI features

---

## AI Enhancement Integration

### **RAG Implementation Guidelines**
- **Phase 1**: Basic AI features (content suggestions, user preferences)
- **Phase 2**: Advanced RAG (personalized recommendations, gaming context awareness)
- **Scalability**: Architecture should support expanding AI capabilities

### **Gaming Context Integration**
- **Detection**: Automatically detect gaming content and context
- **Adaptation**: UI should adapt based on gaming preferences and activity
- **Community**: AI should understand gaming community dynamics

---

This document serves as the comprehensive guide for maintaining consistency, quality, and AI-first principles throughout SnapConnect's development lifecycle. All team members must follow these guidelines to ensure a scalable, maintainable, and intelligent codebase. 
