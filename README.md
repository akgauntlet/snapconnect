# SnapConnect

**Gaming-focused ephemeral messaging platform with AI-enhanced features**

SnapConnect is a modern React Native application built with Expo, featuring a cyber gaming aesthetic and AI-powered capabilities. The platform enables gamers to share ephemeral messages, gaming clips, and achievements with intelligent content suggestions and personalized experiences.

## 🎮 Features

- **Gaming-First Design**: Cyber gaming aesthetic with RGB color palette
- **Ephemeral Messaging**: Messages that disappear after set time periods
- **AI-Enhanced**: Smart content generation and personalized recommendations
- **Multi-Platform Gaming**: Integration with Steam, Discord, Xbox, PlayStation, and Twitch
- **Real-time Communication**: Instant messaging with gaming context awareness
- **Achievement Tracking**: Gaming achievements and progress sharing
- **Camera & Media**: Advanced camera features with gaming filters

## 🏗️ Architecture

This project follows an **AI-first architecture** with modular, scalable design:

```
snapconnect/
├── src/                          # Main application source
│   ├── components/               # Reusable UI components
│   ├── screens/                  # Full-screen components
│   ├── services/                 # External service integrations
│   ├── stores/                   # Zustand state management
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript definitions
│   ├── config/                   # Configuration files
│   └── navigation/               # Navigation setup
├── assets/                       # Static assets
├── docs/                         # Project documentation
├── scripts/                      # Build and utility scripts
└── __tests__/                    # Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- React Native development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/snapconnect.git
   cd snapconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🎨 Tech Stack

- **Framework**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation 7
- **State Management**: Zustand
- **TypeScript**: Full type safety
- **AI Services**: OpenAI GPT-4, Pinecone Vector DB
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Gaming APIs**: Steam, Discord, Xbox Live, PlayStation, Twitch

## 🎯 Development Guidelines

### File Organization
- **Maximum 500 lines per file** for AI tool compatibility
- **Comprehensive documentation** for all functions and components
- **Modular architecture** with single responsibility principle
- **Descriptive naming** with self-documenting code

### Code Style
- Use functional programming patterns
- Prefer TypeScript for type safety
- Follow gaming aesthetic design system
- Implement AI-first development practices

### Documentation Standards
Every file must include:
```javascript
/**
 * @file ComponentName.tsx
 * @description Brief description of the component's purpose
 * @author SnapConnect Team
 * @created YYYY-MM-DD
 * @modified YYYY-MM-DD
 * @ai_context How this component integrates with AI features
 */
```

## 🎮 Gaming Integration

SnapConnect integrates with major gaming platforms:
- **Steam**: Game library, achievements, friends
- **Discord**: Server integration, voice channels
- **Xbox Live**: Gamertag, achievements, friends
- **PlayStation**: PSN profile, trophies, friends
- **Twitch**: Streaming status, clips, follows

## 🤖 AI Features

- **Content Generation**: Smart captions and hashtags
- **Gaming Context**: Automatic game detection and suggestions
- **Smart Replies**: AI-powered response suggestions
- **Friend Matching**: AI-driven friend recommendations
- **Content Moderation**: Automated content filtering
- **Personalization**: Adaptive UI based on gaming preferences

## 🎨 Design System

### Color Palette (Cyber Gaming)
- **Primary**: Cyan (#00ffff) and Magenta (#ff00ff)
- **Gaming**: Green (#00ff41), Blue (#0080ff), Orange (#ff8000)
- **Background**: Deep blacks and dark grays
- **Accents**: RGB gaming colors with glow effects

### Typography
- **Display**: Orbitron (gaming headers, max 20% usage)
- **Body**: Inter (readable content, 70% usage)
- **Technical**: JetBrains Mono (code/stats, 10% usage)

## 📱 Screens

- **Authentication**: Welcome, Login, Signup
- **Camera**: Capture, Filters, Gaming Overlays
- **Messaging**: Chat, Group Chat, Gaming Rooms
- **Profile**: User Profile, Gaming Stats, Achievements
- **Stories**: Gaming Stories, Clips, Highlights
- **Gaming**: Dashboard, Integrations, Live Games

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_FIREBASE_CONFIG=your_firebase_config
```

### Firebase Setup
1. Create Firebase project
2. Enable Authentication, Firestore, Storage
3. Add configuration to `src/config/firebase.js`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📱 Build & Deploy

```bash
# Build for production
npm run build

# Create development build
npx expo build:android
npx expo build:ios
```

## 🤝 Contributing

1. Follow the established architecture and coding standards
2. Ensure all new files include proper documentation
3. Maintain the 500-line file limit
4. Write tests for new features
5. Follow the gaming aesthetic design system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎮 Gaming Community

Join our gaming community:
- Discord Server: [link]
- Reddit: r/SnapConnect
- Twitter: @SnapConnectApp

---

**Built with ❤️ for the gaming community**
