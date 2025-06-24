/**
 * @file FirebaseTest.tsx
 * @description Firebase connection and service testing component
 * Used for debugging Firebase configuration and connectivity issues
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/config/firebase: Firebase configuration
 * - @/stores/authStore: Authentication state
 * 
 * @usage
 * <FirebaseTest />
 * 
 * @ai_context
 * Provides diagnostic information for Firebase services and authentication
 */

import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { getFirebaseAuth, getFirebaseDB, getFirebaseStorage, initializeFirebaseServices } from '../../config/firebase';
import { useAuthStore } from '../../stores/authStore';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

/**
 * Firebase service testing component
 * 
 * @returns {React.ReactElement} Test interface
 */
const FirebaseTest: React.FC = () => {
  const { user } = useAuthStore();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Firebase Initialization', status: 'pending', message: 'Not started' },
    { name: 'Auth Service', status: 'pending', message: 'Not started' },
    { name: 'Firestore Service', status: 'pending', message: 'Not started' },
    { name: 'Storage Service', status: 'pending', message: 'Not started' },
    { name: 'User Authentication', status: 'pending', message: 'Not started' },
    { name: 'Storage Upload Test', status: 'pending', message: 'Not started' },
  ]);

  /**
   * Update a specific test result
   */
  const updateTest = (index: number, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, details } : test
    ));
  };

  /**
   * Run Firebase initialization test
   */
  const testFirebaseInit = async () => {
    try {
      updateTest(0, 'pending', 'Testing Firebase initialization...');
      await initializeFirebaseServices();
      updateTest(0, 'success', 'Firebase initialized successfully');
      return true;
    } catch (error) {
      updateTest(0, 'error', `Failed: ${error.message}`, error);
      return false;
    }
  };

  /**
   * Test Firebase Auth service
   */
  const testAuthService = async () => {
    try {
      updateTest(1, 'pending', 'Testing Auth service...');
      const auth = getFirebaseAuth();
      updateTest(1, 'success', `Auth service active. User: ${auth.currentUser?.uid || 'Not signed in'}`, {
        currentUser: auth.currentUser?.uid,
        isSignedIn: !!auth.currentUser
      });
      return true;
    } catch (error) {
      updateTest(1, 'error', `Failed: ${error.message}`, error);
      return false;
    }
  };

  /**
   * Test Firestore service
   */
  const testFirestoreService = async () => {
    try {
      updateTest(2, 'pending', 'Testing Firestore service...');
      const db = getFirebaseDB();
      
      // Try to read from a collection (without actually creating data)
      const testQuery = db.collection('test').limit(1);
      await testQuery.get();
      
      updateTest(2, 'success', 'Firestore service active and accessible');
      return true;
    } catch (error) {
      updateTest(2, 'error', `Failed: ${error.message}`, error);
      return false;
    }
  };

  /**
   * Test Firebase Storage service
   */
  const testStorageService = async () => {
    try {
      updateTest(3, 'pending', 'Testing Storage service...');
      const storage = getFirebaseStorage();
      
      // Create a reference to test connectivity
      const testRef = storage.ref().child('test/connection-test');
      
      updateTest(3, 'success', `Storage service active. Bucket: ${storage.app.options.storageBucket}`, {
        bucket: storage.app.options.storageBucket,
        refPath: testRef.fullPath
      });
      return true;
    } catch (error) {
      updateTest(3, 'error', `Failed: ${error.message}`, error);
      return false;
    }
  };

  /**
   * Test user authentication status
   */
  const testUserAuth = async () => {
    try {
      updateTest(4, 'pending', 'Checking user authentication...');
      
      if (!user) {
        updateTest(4, 'error', 'No user logged in', { userState: null });
        return false;
      }
      
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        updateTest(4, 'error', 'User in store but not in Firebase Auth', { 
          storeUser: user.uid, 
          firebaseUser: null 
        });
        return false;
      }
      
      if (user.uid !== currentUser.uid) {
        updateTest(4, 'error', 'User ID mismatch between store and Firebase', {
          storeUser: user.uid,
          firebaseUser: currentUser.uid
        });
        return false;
      }
      
      updateTest(4, 'success', `User authenticated: ${user.uid}`, {
        uid: user.uid,
        email: user.email,
        emailVerified: currentUser.emailVerified
      });
      return true;
    } catch (error) {
      updateTest(4, 'error', `Failed: ${error.message}`, error);
      return false;
    }
  };

  /**
   * Test Storage upload capability
   */
  const testStorageUpload = async () => {
    try {
      updateTest(5, 'pending', 'Testing Storage upload capability...');
      
      if (!user) {
        updateTest(5, 'error', 'Cannot test upload without authenticated user');
        return false;
      }
      
      const storage = getFirebaseStorage();
      const testPath = `test/${user.uid}/connection-test-${Date.now()}.txt`;
      const testRef = storage.ref().child(testPath);
      
      // Create a simple text blob
      const testData = 'Firebase Storage connection test';
      const blob = new Blob([testData], { type: 'text/plain' });
      
      console.log('🧪 Testing storage upload with:', {
        path: testPath,
        blobSize: blob.size,
        blobType: blob.type
      });
      
      // Attempt upload
      const uploadTask = await testRef.put(blob);
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      
      // Clean up test file
      await testRef.delete();
      
      updateTest(5, 'success', 'Storage upload test successful', {
        testPath,
        downloadUrl: downloadUrl.substring(0, 100) + '...'
      });
      return true;
    } catch (error) {
      updateTest(5, 'error', `Upload test failed: ${error.message}`, {
        errorCode: error.code,
        errorMessage: error.message
      });
      return false;
    }
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    console.log('🧪 Starting Firebase connectivity tests...');
    
    const initSuccess = await testFirebaseInit();
    if (!initSuccess) return;
    
    await testAuthService();
    await testFirestoreService();
    await testStorageService();
    await testUserAuth();
    await testStorageUpload();
    
    console.log('🧪 Firebase tests completed');
  };

  /**
   * Show test details
   */
  const showTestDetails = (test: TestResult) => {
    if (test.details) {
      Alert.alert(
        `${test.name} Details`,
        JSON.stringify(test.details, null, 2),
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <View className="p-4">
      <Text className="text-white font-orbitron text-lg mb-4">Firebase Connectivity Test</Text>
      
      <TouchableOpacity
        onPress={runAllTests}
        className="bg-cyber-cyan px-4 py-2 rounded-lg mb-4"
      >
        <Text className="text-cyber-black font-inter font-semibold text-center">
          Run All Tests
        </Text>
      </TouchableOpacity>
      
      {tests.map((test, index) => (
        <TouchableOpacity
          key={test.name}
          onPress={() => showTestDetails(test)}
          className="flex-row items-center justify-between p-3 mb-2 bg-cyber-gray/20 rounded-lg"
        >
          <View className="flex-1">
            <Text className="text-white font-inter font-medium">{test.name}</Text>
            <Text 
              className="text-sm mt-1"
              style={{ color: getStatusColor(test.status) }}
            >
              {test.message}
            </Text>
          </View>
          <View 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStatusColor(test.status) }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default FirebaseTest; 
