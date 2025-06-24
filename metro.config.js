const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver to handle Firebase and AsyncStorage properly
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver?.alias,
    '@react-native-async-storage/async-storage': path.resolve(
      __dirname,
      'node_modules/@react-native-async-storage/async-storage'
    ),
  },
  resolverMainFields: ['react-native', 'browser', 'main'],
  platforms: ['ios', 'android', 'native', 'web'],
};

// Reduce max workers to prevent memory issues
config.maxWorkers = 1;

module.exports = withNativeWind(config, { input: './global.css' });
