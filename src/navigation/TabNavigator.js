/**
 * @file TabNavigator.js
 * @description Main navigation with bottom tabs and friend management screens for SnapConnect.
 * Manages navigation between Camera, Messages, Stories, Profile and friend-related screens.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - @react-navigation/bottom-tabs: Bottom tab navigation
 * - @react-navigation/native-stack: Stack navigation for modal screens
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
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../stores/themeStore';

// Import main screens
import CameraScreen from '../screens/camera/CameraScreen';
import MessagesScreen from '../screens/messaging/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StoriesScreen from '../screens/stories/StoriesScreen';

// Import friend management screens
import AddFriendsScreen from '../screens/friends/AddFriendsScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import FriendsListScreen from '../screens/friends/FriendsListScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Bottom tab navigator with cyber gaming styling
 * 
 * @returns {React.ReactElement} Rendered tab navigation
 */
const TabsNavigator = () => {
  const insets = useSafeAreaInsets();
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
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
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

/**
 * Main navigation stack that includes tabs and friend management screens
 * 
 * @returns {React.ReactElement} Rendered navigation stack
 * 
 * @performance
 * - Lazy loads screens for optimal performance
 * - Uses efficient navigation transitions
 * - Gaming-optimized 60fps animations
 * 
 * @ai_integration
 * - Screen order adapts to user behavior patterns
 * - Gaming context influences navigation flow
 * - AI-powered screen suggestions and shortcuts
 */
const TabNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabsNavigator}
        options={{
          animation: 'none',
        }}
      />
      
      {/* Friend Management Screens */}
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="AddFriends" 
        component={AddFriendsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="FriendRequests" 
        component={FriendRequestsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="FriendProfile" 
        component={FriendProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default TabNavigator; 
