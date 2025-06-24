/**
 * @file FirebaseTest.tsx
 * @description Test component to verify Firebase initialization status
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getFirebaseAuth, getFirebaseDB, getFirebaseStorage, isFirebaseInitialized } from '../../config/firebase';

/**
 * Firebase test component to display initialization status
 * @returns {React.ReactElement} Rendered component
 */
const FirebaseTest: React.FC = () => {
  const [status, setStatus] = useState('Checking...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const checkFirebaseStatus = () => {
      try {
        const initialized = isFirebaseInitialized();
        
        if (initialized) {
          // Test each service individually
          const serviceStatuses: string[] = [];
          
          try {
            getFirebaseAuth();
            serviceStatuses.push('✅ Firebase Auth available');
          } catch (authError) {
            serviceStatuses.push(`❌ Firebase Auth error: ${authError instanceof Error ? authError.message : String(authError)}`);
          }
          
          try {
            getFirebaseDB();
            serviceStatuses.push('✅ Firestore available');
          } catch (dbError) {
            serviceStatuses.push(`❌ Firestore error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
          }
          
          try {
            getFirebaseStorage();
            serviceStatuses.push('✅ Firebase Storage available');
          } catch (storageError) {
            serviceStatuses.push(`❌ Storage error: ${storageError instanceof Error ? storageError.message : String(storageError)}`);
          }
          
          setStatus('✅ Firebase Initialized Successfully');
          setDetails(['✅ Firebase App initialized', ...serviceStatuses]);
        } else {
          setStatus('⚠️ Firebase Not Initialized');
          setDetails(['Firebase services are not yet ready']);
        }
      } catch (error) {
        setStatus('❌ Firebase Error');
        setDetails([`Error: ${error instanceof Error ? error.message : String(error)}`]);
      }
    };

    // Check immediately
    checkFirebaseStatus();
    
    // Check again after a short delay to catch late initialization
    const timer = setTimeout(checkFirebaseStatus, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Status</Text>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.details}>
        {details.map((detail, index) => (
          <Text key={index} style={styles.detail}>
            {detail}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  details: {
    marginTop: 5,
  },
  detail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginVertical: 2,
  },
});

export default FirebaseTest; 
