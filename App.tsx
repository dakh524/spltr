import React, { useEffect, useState } from 'react';
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
import { View, ActivityIndicator } from 'react-native';
import { Colors } from './src/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

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
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neonGreen} size="large" />
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
