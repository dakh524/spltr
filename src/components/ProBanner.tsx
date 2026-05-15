import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

const ProBanner = () => {
  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Handle Pro upgrade
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={handlePress}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>SPLITR Pro</Text>
          <Text style={styles.subtitle}>Unlock exclusive features</Text>
        </View>
        <View style={styles.iconContainer}>
          <Crown color={Colors.white} size={32} />
        </View>
      </View>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Upgrade Now</Text>
        <ChevronRight color={Colors.white} size={16} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.purple,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.purple + '80',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {},
  title: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    color: Colors.white + 'cc',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 4,
  },
  iconContainer: {
    backgroundColor: Colors.white + '30',
    padding: 12,
    borderRadius: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    marginRight: 4,
  },
});

export default ProBanner;
