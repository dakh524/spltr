import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import AppNavigator from './src/navigation/AppNavigator';
import { View, ActivityIndicator, Animated, Image, Text, StyleSheet } from 'react-native';
import { Colors } from './src/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
        'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
        'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
        'BebasNeue-Regular': BebasNeue_400Regular,
      });
      setFontsLoaded(true);
    }
    loadFonts();

    // Blinking (Pulsating) Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Hide splash after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || showSplash) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.centerContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Image 
              source={require('./assets/logo.png')} 
              style={styles.splashLogo} 
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.splashTitle}>SPLITR</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.companyName}>DAKH EDU SOLUTIONS</Text>
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashTitle: {
    color: Colors.neonGreen,
    fontSize: 42,
    fontFamily: 'BebasNeue-Regular',
    letterSpacing: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  poweredBy: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  companyName: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 4,
    letterSpacing: 1,
  },
});
