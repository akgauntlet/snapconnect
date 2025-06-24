# UI Rules - SnapConnect

This document defines the core design principles and user interface guidelines for SnapConnect, a gaming-focused ephemeral messaging platform. These rules ensure consistent user experience across all features while maintaining a **sophisticated gaming aesthetic** that appeals to our target audience.

## **Core Visual Strategy:**
- **Less is More**: Reduced color palette creates stronger visual impact
- **Smooth Animations**: Elegant transitions over jarring effects  
- **Professional Gaming**: AAA quality design inspired by premium gaming interfaces
- **Clean Hierarchy**: Clear information architecture without visual noise
- **Purposeful Design**: Every element serves a specific user need

---

## Core Design Principles

### 1. **Camera-First Design**
- **Primary Interface**: Camera screen is the default landing view, not buried in navigation
- **Minimal Overlay**: Keep UI elements minimal during content capture to avoid distracting from the creative process
- **Quick Access**: Essential features (filters, flash, camera flip) must be accessible within one tap
- **Gaming Integration**: Screen recording capabilities for mobile games should be prominently accessible
- **Implementation**: Use Expo Camera as the main interface component with overlay controls

### 2. **Gesture-Driven Navigation**
- **Intuitive Gestures**: Swipe, tap, and hold patterns should feel natural and fast
- **Consistency**: Maintain gesture patterns across all screens (swipe left/right for navigation, hold for video)
- **Gaming Familiarity**: Leverage gesture controls similar to mobile gaming interfaces
- **Feedback**: Provide immediate haptic and visual feedback for all gesture interactions
- **Implementation**: Use React Navigation gesture handlers with consistent animation patterns

### 3. **Ephemeral-First Mindset**
- **Temporary Content**: Design interfaces that emphasize the temporary nature of content
- **Clear Timers**: Always display countdown timers and disappearing indicators prominently
- **Minimal Save Options**: De-emphasize permanent saving features to maintain spontaneous feel
- **Gaming Context**: Perfect for sharing quick gaming moments without permanent commitment
- **Visual Cues**: Use disappearing animations and temporary UI elements

### 4. **Progressive Disclosure**
- **Essential First**: Show only critical features initially, hide advanced options
- **Contextual Menus**: Display feature-specific options only when relevant
- **Gaming Balance**: Keep gaming-specific features accessible but not overwhelming to general users
- **Learning Curve**: Gradually introduce complex features as users become more engaged
- **Implementation**: Use expandable sections and contextual overlays

### 5. **Immediate Feedback**
- **Responsive UI**: Every interaction must have instant visual or haptic response (< 100ms)
- **Gaming Standards**: Match the responsiveness expectations of modern gaming interfaces
- **Loading States**: Use engaging animations during processing rather than static spinners
- **Success Indicators**: Clear confirmation for all user actions
- **Error Handling**: Immediate, clear error messages with actionable solutions

---

## Gaming-Specific Considerations

### **Gaming Persona Alignment**
- **Target Audience**: Tech-savvy gamers aged 16-35 who appreciate sophisticated design
- **Aesthetic Preferences**: Clean cyber aesthetics, subtle effects, professional gaming interfaces
- **Interaction Patterns**: Fast-paced, responsive interfaces with smooth animations
- **Community Features**: Emphasize clan/group functionality and gaming achievements
- **Visual Maturity**: Sophisticated rather than flashy - AAA game quality design

### **Gaming UI Elements**
- **Overlay Integration**: Support for gaming overlays (controller UI, game stats, achievements)
- **Screen Recording**: Seamless integration with mobile game screen recording
- **Gaming Filters**: Priority placement for gaming-themed AR filters and effects
- **Achievement System**: Visual celebration of milestones with gaming-inspired animations
- **Status Indicators**: Gaming-style health bars, progress indicators, and level displays

### **Content Recognition**
- **Gaming Context Awareness**: Interface should adapt when gaming content is detected
- **Smart Suggestions**: Gaming-relevant hashtags, groups, and friends prioritized
- **Gaming Categories**: Dedicated sections for FPS, mobile, console, PC gaming content
- **Tournament Integration**: Special UI modes for gaming events and competitions

---

## Mobile-Specific Design Rules

### **Touch Target Optimization**
- **Minimum Size**: 48dp minimum touch targets for Android
- **Gaming Audience**: Larger phones common in gaming community - optimize for larger screens
- **Thumb-Friendly**: Primary actions within comfortable thumb reach zones
- **One-Handed Use**: Critical features accessible with one-handed operation
- **Safe Areas**: Respect device safe areas and navigation gestures

### **Performance Considerations**
- **React Native Optimization**: Use FlatList for scrollable content, avoid ScrollView with many items
- **Image Optimization**: Implement proper image sizing and WebP format when possible
- **Memory Management**: Proper cleanup of camera resources and event listeners
- **Bundle Size**: Code splitting to keep initial bundle small, lazy load gaming features

### **Android Optimization**
- **Material Design**: Respect Material Design principles while maintaining gaming aesthetic
- **Navigation**: Use React Navigation with Android-appropriate animations
- **System Integration**: Handle Android back button, navigation gestures, and system UI
- **Permissions**: Handle camera, microphone, and storage permissions gracefully

### **Responsive Design**
- **Screen Sizes**: Support various Android phone sizes (5" to 7"+) and tablets
- **Orientation**: Primarily portrait but support landscape for gaming content viewing
- **Density**: Support ldpi to xxxhdpi with appropriate asset scaling
- **Accessibility**: Minimum contrast ratios, TalkBack support, font scaling

---

## Motion & Animation Principles

### **Timing & Easing**
- **Fast & Snappy**: 200-300ms transitions for navigation and state changes
- **Gaming Responsiveness**: Match gaming UI expectations for immediate feedback
- **Easing Curves**: Use ease-out for entrances, ease-in for exits, ease-in-out for transitions
- **Bounce Effects**: Subtle spring animations for success states and interactions

### **Professional Gaming Animations**
- **Subtle Glow Effects**: Gentle pulsing on interactive elements with cyan/white
- **Smooth Transitions**: Clean fade and slide animations for state changes
- **Color-Coded Feedback**: Green for success, red for errors, cyan for interactions
- **Elegant Motion**: Smooth cubic-bezier easing for premium feel
- **Purposeful Effects**: Every animation serves a functional purpose

### **Performance Guidelines**
- **60 FPS Target**: All animations must run at 60fps on target devices
- **GPU Acceleration**: Use transform properties (translateX, scale, opacity) for performance
- **React Native Reanimated**: Use for complex animations requiring native thread performance
- **Reduce Motion**: Respect accessibility settings for reduced motion
- **Battery Consideration**: Avoid excessive animations that drain battery during gaming

### **Specific Animation Patterns**
- **Page Transitions**: Slide animations with cyber-themed easing
- **Filter Application**: Smooth morphing with progress indicators
- **Message Sending**: Rocket/bullet trajectory animations
- **Story Viewing**: Cinematic transitions between story segments
- **Camera Effects**: Real-time filter application with smooth blending

---

## Accessibility Guidelines

### **Color & Contrast**
- **WCAG Compliance**: Minimum 4.5:1 contrast ratio for text
- **Clean Color Palette**: Primary cyan/white, secondary green/red only
- **Color Blindness**: Use icons and text labels alongside color coding
- **Dark Theme**: Primary interface optimized for dark environments
- **Professional Balance**: Sophisticated colors that maintain readability

### **Typography & Readability**
- **Font Sizes**: Minimum 16dp for body text, respect system font scaling
- **Clean Typography**: Prioritize Inter for readability, use Orbitron minimally
- **Line Height**: 1.4-1.6 for optimal readability
- **Font Weight**: Clear hierarchy with 400 (regular), 600 (medium), 700 (bold)
- **White Text**: Primary text should be clean white on dark backgrounds

### **Interaction & Navigation**
- **Screen Reader**: Proper semantic markup and ARIA labels
- **Voice Control**: Support for voice navigation where appropriate
- **Keyboard Navigation**: Tab order and focus management for external keyboards
- **Motor Accessibility**: Adequate touch targets and gesture alternatives

---

## Error Handling & Edge Cases

### **Network Connectivity**
- **Offline Graceful**: Clear indicators when features require internet
- **Retry Mechanisms**: One-tap retry buttons with progress feedback
- **Cached Content**: Show cached stories and messages when offline
- **Queue Management**: Queue outgoing messages with clear status indicators

### **Device Limitations**
- **Low Storage**: Clear warnings with actionable cleanup suggestions
- **Poor Camera**: Graceful degradation for devices with limited camera capabilities
- **Low Performance**: Reduced animation complexity on older devices
- **Permission Denials**: Clear explanations with settings shortcuts

### **Content Edge Cases**
- **Empty States**: Engaging illustrations and clear next-step guidance
- **Loading States**: Gaming-themed loading animations, never blank screens
- **Error States**: Friendly error messages with retry options
- **Success States**: Celebratory animations that reinforce positive actions

---

## Testing & Quality Assurance

### **Device Testing Requirements**
- **Android**: Test on various screen sizes and Android versions (API 21+)
- **Device Range**: Low-end (Android 7.0), mid-range (Android 10), high-end (Android 14)
- **Performance**: Test on lower-end devices to ensure smooth operation
- **Gaming Context**: Test while actually playing mobile games for interference

### **User Testing Priorities**
- **Gaming Community**: Regular testing with actual gaming community members
- **Gesture Flows**: Verify all gesture interactions feel natural
- **Camera Performance**: Test camera operations in various lighting conditions
- **Social Features**: Test group interactions and friend management flows

### **Automated Testing**
- **Component Testing**: Test all UI components in isolation
- **Animation Testing**: Verify animations complete properly
- **Accessibility Testing**: Automated accessibility audits
- **Performance Testing**: Monitor render performance and memory usage

---

## Implementation Guidelines

### **Component Architecture**
- **Functional Components**: Use hooks over class components
- **Custom Hooks**: Extract business logic to reusable hooks
- **Component Size**: Keep components under 200 lines, split larger ones
- **Props Interface**: Use TypeScript interfaces for all component props

### **State Management**
- **Zustand Stores**: Separate stores for auth, messages, camera, theme
- **Local State**: Use useState for component-specific state
- **Global State**: Minimal global state, prefer prop drilling for simple data
- **Performance**: Use selectors to prevent unnecessary re-renders

### **Styling Implementation**
- **NativeWind**: Use utility classes with gaming theme configuration
- **Component Variants**: Create reusable styled component variants
- **Theme Provider**: Centralized theme management for easy updates
- **Platform Styles**: Handle iOS/Android differences consistently

---

This document serves as the definitive guide for maintaining consistent, gaming-focused user interface design throughout SnapConnect's development lifecycle. 
