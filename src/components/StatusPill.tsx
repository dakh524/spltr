import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface StatusPillProps {
  status: 'Paid' | 'Pending' | 'Partial' | 'Settled';
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'Paid':
      case 'Settled':
        return { bg: Colors.neonGreen + '20', text: Colors.neonGreen };
      case 'Pending':
        return { bg: Colors.hotPink + '20', text: Colors.hotPink };
      case 'Partial':
        return { bg: Colors.amber + '20', text: Colors.amber };
      default:
        return { bg: Colors.muted + '20', text: Colors.muted };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    fontWeight: '600',
  },
});

export default StatusPill;
