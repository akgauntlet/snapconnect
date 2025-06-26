/**
 * @file FriendRequestsScreen.tsx
 * @description Friend requests management screen for handling incoming and outgoing requests.
 * Allows users to accept, decline, and cancel friend requests with real-time updates.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useFriendRequests } from '../../hooks/useFriendRequests';
import { friendsService } from '../../services/firebase/friendsService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../utils/alertService';

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    displayName: string;
    username: string;
    profilePhoto?: string;
    bio?: string;
    mutualFriends?: number;
    lastActive?: Date;
  };
  type: 'incoming' | 'outgoing';
}

type FriendRequestsNavigationProp = NativeStackNavigationProp<any, 'FriendRequests'>;

const FriendRequestsScreen: React.FC = () => {
  const navigation = useNavigation<FriendRequestsNavigationProp>();
  const route = useRoute<any>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();

  // Get source tab from route params
  const sourceTab = route.params?.sourceTab || 'Profile';

  // Use the custom hook for friend requests
  const { 
    incomingRequests, 
    outgoingRequests, 
    isLoading, 
    error, 
    refreshRequests 
  } = useFriendRequests();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());



  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshRequests();
    setIsRefreshing(false);
  }, [refreshRequests]);

  const acceptRequest = useCallback(async (request: FriendRequest) => {
    if (!user) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(request.id));
      await friendsService.acceptFriendRequest(request.id, user.uid);
      
      // Refresh requests to update the UI and badge count
      await refreshRequests();
      
      showSuccessAlert(`You are now friends with ${request.user.displayName}!`, 'Friend Added!');
    } catch (error) {
      console.error('Accept request failed:', error);
      showErrorAlert('Failed to accept friend request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  }, [user, refreshRequests]);

  const declineRequest = useCallback(async (request: FriendRequest) => {
    if (!user) return;

    showConfirmAlert(
      'Decline Request',
      `Decline friend request from ${request.user.displayName}?`,
      async () => {
        try {
          setProcessingRequests(prev => new Set(prev).add(request.id));
          await friendsService.declineFriendRequest(request.id, user.uid);
          
          // Refresh requests to update the UI and badge count
          await refreshRequests();
        } catch (error) {
          console.error('Decline request failed:', error);
          showErrorAlert('Failed to decline friend request. Please try again.');
        } finally {
          setProcessingRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(request.id);
            return newSet;
          });
        }
      }
    );
  }, [user, refreshRequests]);

  const getUserInitials = (user: FriendRequest['user']) => {
    return user.displayName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <TouchableOpacity className="flex-row items-center p-4 mx-4 mb-2 bg-cyber-dark/50 rounded-lg">
      <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
        <Text className="text-cyber-cyan font-inter font-semibold text-sm">
          {getUserInitials(item.user)}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-white font-inter font-medium text-base">
          {item.user.displayName}
        </Text>
        <Text className="text-white/60 font-inter text-sm">
          @{item.user.username}
        </Text>
        {item.user.mutualFriends && item.user.mutualFriends > 0 && (
          <Text className="text-cyber-cyan font-inter text-xs mt-1">
            {item.user.mutualFriends} mutual friends
          </Text>
        )}
        <Text className="text-white/40 font-inter text-xs mt-1">
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => declineRequest(item)}
          disabled={processingRequests.has(item.id)}
          className="w-10 h-10 bg-red-500/20 rounded-full justify-center items-center mr-2"
        >
          <Ionicons name="close" size={20} color="#ef4444" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => acceptRequest(item)}
          disabled={processingRequests.has(item.id)}
          className="w-10 h-10 bg-green-500/20 rounded-full justify-center items-center"
        >
          {processingRequests.has(item.id) ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#10b981" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTab = (tab: typeof activeTab, label: string, count: number) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 items-center py-3 ${
        activeTab === tab ? 'border-b-2 border-cyber-cyan' : ''
      }`}
    >
      <Text className={`font-inter font-medium ${
        activeTab === tab ? 'text-cyber-cyan' : 'text-white/60'
      }`}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate('FriendsList', { sourceTab })} className="p-2 mr-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-orbitron text-xl">Friend Requests</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddFriends', { sourceTab })}
          className="p-2"
        >
          <Ionicons name="person-add" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>

      <View className="flex-row px-6">
        {renderTab('incoming', 'Incoming', incomingRequests.length)}
        {renderTab('outgoing', 'Outgoing', outgoingRequests.length)}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-white/60 font-inter text-base mt-4">
            Loading requests...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={refreshRequests}
            className="bg-cyber-cyan/20 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-cyber-cyan font-inter font-semibold">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : filteredRequests.length > 0 ? (
        <FlatList
          data={filteredRequests}
          renderItem={renderIncomingRequest}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons 
            name={activeTab === 'incoming' ? 'mail-outline' : 'paper-plane-outline'} 
            size={64} 
            color="rgba(255,255,255,0.3)" 
          />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
            {activeTab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
          </Text>
          <Text className="text-white/50 font-inter text-sm text-center mb-6">
            {activeTab === 'incoming' 
              ? 'Friend requests you receive will appear here'
              : 'Friend requests you send will appear here'
            }
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFriends', { sourceTab })}
            className="bg-cyber-cyan px-6 py-3 rounded-lg"
          >
            <Text className="text-cyber-black font-inter font-semibold">
              Find Friends
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default FriendRequestsScreen; 
