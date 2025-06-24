/**
 * @file index.js
 * @description Entry point for React Native Web
 */

import { AppRegistry } from 'react-native';
import App from './App';

// Register the main component
AppRegistry.registerComponent('main', () => App);

// For web, we need to run the app
if (typeof window !== 'undefined') {
  AppRegistry.runApplication('main', {
    rootTag: document.getElementById('root'),
  });
} 
