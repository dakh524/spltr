import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AdBanner = () => {
  // In a real app with AdMob setup:
  /*
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
  */

  // Placeholder for the UI
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>AD CONTENT</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  placeholder: {
    height: 60,
    backgroundColor: Colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  text: {
    color: Colors.muted,
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Medium',
  },
});

export default AdBanner;
