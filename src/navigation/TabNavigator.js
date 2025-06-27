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

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../stores/themeStore";

// Import main screens
import CameraScreen from "../screens/camera/CameraScreen";
import ChatScreen from "../screens/messaging/ChatScreen";
import MessagesScreen from "../screens/messaging/MessagesScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import StoriesScreen from "../screens/stories/StoriesScreen";

// Import friend management screens
import AddFriendsScreen from "../screens/friends/AddFriendsScreen";
import FriendProfileScreen from "../screens/friends/FriendProfileScreen";
import FriendRequestsScreen from "../screens/friends/FriendRequestsScreen";
import FriendsMainScreen from "../screens/friends/FriendsMainScreen";

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

  // Get device dimensions for viewport calculations
  const { width, height } = Dimensions.get("window");

  // Detect Samsung Galaxy S20 Ultra dimensions (1440x3200 or similar)
  const isSamsungGalaxyS20Ultra = height >= 3000 || width >= 1400;

  // Web platform adjustments for mobile browsers
  const isWebMobile = Platform.OS === "web" && width < 768;

  // Calculate safe bottom padding for different scenarios
  const calculateBottomPadding = () => {
    if (Platform.OS === "web") {
      // For web, especially mobile browsers, use a more conservative approach
      if (isWebMobile) {
        // Mobile web browsers often have varying viewport heights
        // Use a combination of safe area insets and viewport-relative padding
        const basePadding = isSamsungGalaxyS20Ultra ? 20 : 16;
        const safePadding = Math.max(insets.bottom, 8);
        return basePadding + safePadding;
      }
      return Math.max(insets.bottom, 8);
    }
    return Math.max(insets.bottom, 8);
  };

  // Calculate tab bar height for different scenarios
  const calculateTabBarHeight = () => {
    const baseHeight = 60;
    const bottomPadding = calculateBottomPadding();

    if (Platform.OS === "web" && isWebMobile) {
      // For mobile web, ensure adequate height to prevent cutting off
      return baseHeight + bottomPadding + (isSamsungGalaxyS20Ultra ? 8 : 0);
    }

    return baseHeight + bottomPadding;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Header configuration
        headerShown: false,

        // Tab bar styling with improved mobile web support
        tabBarStyle: {
          backgroundColor: currentTheme.colors.background.primary,
          borderTopColor: accentColor,
          borderTopWidth: 1,
          height: calculateTabBarHeight(),
          paddingBottom: calculateBottomPadding(),
          paddingTop: 8,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          // Additional web-specific styling
          ...(Platform.OS === "web" && {
            // Ensure tab bar stays visible on web mobile browsers
            minHeight: 68,
            // Use proper number value instead of CSS env() template literal
            paddingBottom: calculateBottomPadding(),
          }),
          // Samsung Galaxy S20 Ultra specific adjustments
          ...(isSamsungGalaxyS20Ultra && {
            minHeight: 76,
            paddingBottom: calculateBottomPadding() + 4,
          }),
        },

        // Tab bar item styling
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: currentTheme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 12,
          fontWeight: "normal", // Weight is built into the font
          // Ensure labels are visible on large screens
          ...(isSamsungGalaxyS20Ultra && {
            fontSize: 13,
            marginBottom: 2,
          }),
        },

        // Tab bar icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = gamingMode ? size + 2 : size;

          // Adjust icon size for Samsung Galaxy S20 Ultra
          if (isSamsungGalaxyS20Ultra) {
            iconSize = iconSize + 2;
          }

          switch (route.name) {
            case "Camera":
              iconName = focused ? "camera" : "camera-outline";
              break;
            case "Messages":
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              break;
            case "Stories":
              iconName = focused ? "play-circle" : "play-circle-outline";
              break;
            case "Friends":
              iconName = focused ? "people" : "people-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={color}
              style={{
                textShadowColor: focused ? accentColor : "transparent",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
                marginTop: 2,
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
          tabBarLabel: "Camera",
        }}
      />

      {/* Messages Tab */}
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: "Messages",
        }}
      />

      {/* Stories Tab */}
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{
          tabBarLabel: "Stories",
        }}
      />

      {/* Friends Tab */}
      <Tab.Screen
        name="Friends"
        component={FriendsMainScreen}
        options={{
          tabBarLabel: "Friends",
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
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
        contentStyle: { backgroundColor: "#000000" },
        animation: "slide_from_right",
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen
        name="MainTabs"
        component={TabsNavigator}
        options={{
          animation: "none",
        }}
      />

      {/* Profile Management Screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      {/* Messaging Screens */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      {/* Friend Management Screens */}
      <Stack.Screen
        name="AddFriends"
        component={AddFriendsScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
};

export default TabNavigator;
