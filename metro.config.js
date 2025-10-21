// Metro configuration for React Native
// Includes workarounds for Firebase compatibility

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workaround for Firebase + Metro bundler issues
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main'
];

module.exports = config;

