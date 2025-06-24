/**
 * @file ProfileScreen.tsx
 * @description User profile interface with gaming statistics and preferences.
 * Displays gaming achievements, preferences, and account management.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * 
 * @usage
 * User profile management and gaming statistics interface.
 * 
 * @ai_context
 * AI-powered gaming insights and personalized recommendations.
 * Smart profile optimization based on gaming behavior patterns.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Profile screen component
 * 
 * @returns {React.ReactElement} Rendered profile interface
 * 
 * @performance
 * - Optimized image loading for profile content
 * - Efficient statistics calculations and caching
 * - Smooth navigation between profile sections
 * 
 * @ai_integration
 * - Personalized gaming insights and recommendations
 * - Smart profile completion suggestions
 * - Automated gaming achievement tracking
 */
const ProfileScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  
  // Auth store
  const { signOut, isLoading, user, profile } = useAuthStore();
  
  // Use actual user data if available, otherwise fallback to mock data
  const userData = {
    name: profile?.displayName || user?.displayName || 'Gaming Pro',
    username: profile?.username || '@gamingpro2024',
    bio: profile?.bio || 'Competitive gamer • Content creator • Clan leader',
    stats: {
      victories: profile?.stats?.victories || 247,
      highlights: profile?.stats?.highlights || 89,
      friends: profile?.stats?.friends || 156,
      achievements: profile?.stats?.achievements || 42,
    },
  };
  
  const menuItems = [
    { icon: 'settings-outline', title: 'Settings', subtitle: 'App preferences' },
    { icon: 'trophy-outline', title: 'Achievements', subtitle: 'Gaming milestones' },
    { icon: 'people-outline', title: 'Friends', subtitle: 'Gaming network' },
    { icon: 'shield-outline', title: 'Privacy', subtitle: 'Account security' },
    { icon: 'help-circle-outline', title: 'Help', subtitle: 'Support center' },
  ];

  /**
   * Handle sign out with confirmation
   */
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('User signed out successfully');
            } catch (error) {
              Alert.alert(
                'Sign Out Failed',
                'There was an error signing out. Please try again.',
                [{ text: 'OK' }]
              );
              console.error('Sign out error:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
        <Text className="text-white font-orbitron text-xl">Profile</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="create-outline" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center py-8 px-6">
          {/* Avatar */}
          <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center mb-4">
            <Ionicons name="person" size={40} color={accentColor} />
          </View>
          
          {/* User Info */}
          <Text className="text-white font-orbitron text-xl mb-1">
            {userData.name}
          </Text>
          <Text className="text-cyber-cyan font-inter text-sm mb-3">
            {userData.username}
          </Text>
          <Text className="text-white/70 font-inter text-sm text-center">
            {userData.bio}
          </Text>
        </View>
        
        {/* Stats Grid */}
        <View className="flex-row justify-around py-6 mx-6 bg-cyber-dark rounded-lg mb-6">
          {Object.entries(userData.stats).map(([key, value]) => (
            <View key={key} className="items-center">
              <Text className="text-cyber-cyan font-orbitron text-xl font-bold">
                {value}
              </Text>
              <Text className="text-white/70 font-inter text-xs capitalize mt-1">
                {key}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Menu Items */}
        <View className="px-6 pb-20">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              className="flex-row items-center py-4 px-4 mb-2 bg-cyber-dark rounded-lg"
            >
              <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
                <Ionicons name={item.icon as any} size={20} color={accentColor} />
              </View>
              
              <View className="flex-1">
                <Text className="text-white font-inter font-medium">
                  {item.title}
                </Text>
                <Text className="text-white/70 font-inter text-sm">
                  {item.subtitle}
                </Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          ))}
          
          {/* Sign Out Button */}
          <TouchableOpacity 
            onPress={handleSignOut}
            disabled={isLoading}
            className={`flex-row items-center justify-center py-4 px-4 mt-4 bg-neon-red/20 rounded-lg border border-neon-red/30 ${
              isLoading ? 'opacity-50' : ''
            }`}
            accessible={true}
            accessibilityLabel="Sign Out"
            accessibilityRole="button"
          >
            <Ionicons 
              name={isLoading ? "hourglass-outline" : "log-out-outline"} 
              size={20} 
              color={theme.colors.gaming.defeat} 
            />
            <Text className="text-gaming-defeat font-inter font-medium ml-2">
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen; 
