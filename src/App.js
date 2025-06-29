import { useEffect } from 'react';
import { activityTrackingService } from './src/services/activity/activityTrackingService';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { user } = useAuthStore();

  // Track app opening when app mounts and user is available
  useEffect(() => {
    if (user?.uid) {
      activityTrackingService.trackAppOpen(user.uid);
    }
  }, [user?.uid]);

  // ... rest of the App component ...
} 
