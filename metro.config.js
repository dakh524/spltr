const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for victory-vendor (needed for classic victory-native on web/modern RN)
config.resolver.sourceExts.push('mjs');

module.exports = config;
