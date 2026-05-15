import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = Colors.neonGreen }) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default ProgressBar;
