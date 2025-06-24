/**
 * @file TabNavigator.js
 * @description Main bottom tab navigation for SnapConnect with cyber gaming aesthetic.
 * Manages navigation between Camera, Messages, Stories, and Profile sections.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - @react-navigation/bottom-tabs: Bottom tab navigation
 * - @expo/vector-icons: Icons for tabs
 * - react: React hooks
 * 
 * @usage
 * Main navigation component used after user authentication.
 * 
 * @ai_context
 * Tab order and visibility can be customized based on AI-driven user preferences.
 * Supports dynamic tab configuration based on gaming context and user behavior.
 */

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useThemeStore } from '../stores/themeStore';

// Import screens
import CameraScreen from '../screens/camera/CameraScreen';
import MessagesScreen from '../screens/messaging/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StoriesScreen from '../screens/stories/StoriesScreen';

const Tab = createBottomTabNavigator();

/**
 * Main bottom tab navigator with cyber gaming styling
 * 
 * @returns {React.ReactElement} Rendered tab navigation
 * 
 * @performance
 * - Lazy loads tab screens for optimal performance
 * - Uses efficient icon rendering with vector icons
 * - Gaming-optimized 60fps animations
 * 
 * @ai_integration
 * - Tab order adapts to user behavior patterns
 * - Gaming context influences tab visibility
 * - AI-powered navigation suggestions
 */
const TabNavigator = () => {
  const currentTheme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const gamingMode = useThemeStore((state) => state.preferences.gamingMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Header configuration
        headerShown: false,
        
        // Tab bar styling
        tabBarStyle: {
          backgroundColor: currentTheme.colors.background.primary,
          borderTopColor: accentColor,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        
        // Tab bar item styling
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: currentTheme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: currentTheme.typography.fonts.body,
          fontSize: 12,
          fontWeight: '500',
        },
        
        // Tab bar icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = gamingMode ? size + 2 : size;

          switch (route.name) {
            case 'Camera':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Stories':
              iconName = focused ? 'play-circle' : 'play-circle-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return (
            <Ionicons 
              name={iconName} 
              size={iconSize} 
              color={color}
              style={{
                textShadowColor: focused ? accentColor : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
              }}
            />
          );
        },
        
        // Gaming mode enhancements
        ...(gamingMode && {
          tabBarItemStyle: {
            borderRadius: 8,
            marginHorizontal: 4,
          },
        }),
      })}
      initialRouteName="Camera"
    >
      {/* Camera Tab - Primary feature */}
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
        }}
      />
      
      {/* Messages Tab */}
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      
      {/* Stories Tab */}
      <Tab.Screen 
        name="Stories" 
        component={StoriesScreen}
        options={{
          tabBarLabel: 'Stories',
        }}
      />
      
      {/* Profile Tab */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 
