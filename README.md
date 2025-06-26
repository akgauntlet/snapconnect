# SnapConnect - AI-First Ephemeral Messaging Platform

**Status**: Phase 1 Complete ✅ - Foundation Infrastructure Established  
**Next**: Phase 2 MVP Development Ready

SnapConnect is a gaming-focused ephemeral messaging platform built with React Native, Expo, and Firebase. The application features a sophisticated cyber gaming aesthetic and AI-first architecture.

## 🎮 **Current Status - Phase 1 Complete**

### ✅ **Implemented Features**

- **🎨 Cyber Gaming Theme**: Complete RGB color palette, custom fonts (Orbitron, Inter, JetBrains Mono)
- **🔥 Firebase Integration**: Authentication, Firestore, Storage with security rules
- **🧭 Navigation System**: Bottom tabs with gaming-styled transitions
- **📱 Responsive Design**: Web-optimized with mobile browser support
- **🎯 State Management**: Zustand stores for auth, theme, and preferences
- **🛠️ Development Tools**: Hot reload, path aliases, TypeScript support

### ✅ **Core Components Ready**

- `CyberButton` - Gaming-themed buttons with RGB effects
- `GameCard` - Card components with cyber aesthetics
- `LoadingSpinner` - Gaming-style loading animations
- `CustomAlert` - Web-compatible alert system
- Theme system with gaming color palette and animations

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Authentication, Firestore, and Storage enabled

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd snapconnect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm run web        # Web development
npm run android    # Android development
npm run ios        # iOS development
```

### Environment Setup

Create `.env` file with your Firebase configuration:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🏗️ **Architecture**

### Tech Stack

- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation v7
- **State Management**: Zustand with persistence
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Typography**: Custom fonts (Orbitron, Inter, JetBrains Mono)

### Project Structure

```
src/
├── components/       # Reusable UI components
│   └── common/      # Base components (CyberButton, GameCard, etc.)
├── screens/         # Screen components organized by feature
│   ├── auth/        # Authentication screens
│   ├── camera/      # Camera functionality
│   ├── messaging/   # Chat and messaging
│   ├── profile/     # User profile management
│   └── stories/     # Stories feature
├── navigation/      # Navigation configuration
├── services/        # Firebase and external services
├── stores/          # Zustand state management
├── config/          # App configuration (theme, fonts, Firebase)
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## 🎨 **Design System**

### Color Palette

- **Primary**: Cyber Cyan (#00ffff)
- **Secondary**: Cyber Magenta (#ff00ff)
- **Success**: Matrix Green (#00ff41)
- **Warning**: Gaming Orange (#ff8000)
- **Error**: Neon Red (#ff0040)
- **Background**: Deep blacks and grays for gaming aesthetic

### Typography

- **Display**: Orbitron (gaming headers, max 20% usage)
- **Body**: Inter (readable content, 70% usage)
- **Code**: JetBrains Mono (technical content, 10% usage)

## 🧪 **Testing**

### Manual Testing Checklist

- [ ] Navigation between all main screens works smoothly
- [ ] Cyber gaming theme displays correctly across components
- [ ] Custom fonts render properly on web and mobile
- [ ] Firebase connection established (check browser console)
- [ ] State persistence works after app restart
- [ ] No console errors or warnings
- [ ] App responds to screen size changes

### Performance Testing

- [ ] App startup time < 3 seconds
- [ ] Navigation transitions at 60fps
- [ ] Memory usage < 150MB baseline
- [ ] Bundle size < 25MB

## 🔥 **Firebase Setup**

### Services Configured

- **Authentication**: Email/password, phone number support
- **Firestore**: Real-time database with security rules
- **Storage**: File uploads for media content

### Security Rules

- User data protected by authentication
- Friends and messaging with proper access controls
- Stories readable by authenticated users
- Gaming data and leaderboards configured

## 📋 **Available Scripts**

```bash
npm run start          # Start Expo development server
npm run web           # Start web development server
npm run android       # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator
npm run lint          # Run ESLint
npm run reset-project # Reset project to clean state
```

## 🎯 **Next Steps - Phase 2 MVP**

Ready to begin Phase 2 development with:

- Camera functionality implementation
- Ephemeral messaging system
- Story creation and viewing
- User authentication flows
- Friend management system

## 🤝 **Contributing**

Please follow the established code style and architecture patterns:

- Functional components with hooks
- Descriptive variable names with auxiliary verbs
- Files under 500 lines for AI compatibility
- Comprehensive JSDoc documentation
- Gaming-focused UI/UX principles

## 📄 **License**

This project is proprietary software developed by the SnapConnect team.

---

**Phase 1 Status**: ✅ Complete - Infrastructure Foundation Established  
**Ready for**: Phase 2 MVP Development
