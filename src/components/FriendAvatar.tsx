import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface FriendAvatarProps {
  name: string;
  color: string;
  size?: number;
  isSelected?: boolean;
}

const FriendAvatar: React.FC<FriendAvatarProps> = ({ name, color, size = 50, isSelected }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor: isSelected ? Colors.neonGreen : 'transparent',
          borderWidth: isSelected ? 2 : 0,
        },
        isSelected && styles.glow,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.background,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  glow: {
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default FriendAvatar;
