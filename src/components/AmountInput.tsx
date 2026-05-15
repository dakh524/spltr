import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText }) => {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.currencySymbol}>₹</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            // BUG 2 Fix: Only allow numbers
            const cleaned = text.replace(/[^0-9]/g, '');
            onChangeText(cleaned);
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={Colors.muted}
          selectionColor="transparent"
          autoFocus
        />
        <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  currencySymbol: {
    color: Colors.neonGreen,
    fontSize: 48,
    fontFamily: 'BebasNeue-Regular',
    marginRight: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    color: Colors.neonGreen,
    fontSize: 64,
    fontFamily: 'BebasNeue-Regular',
    minWidth: 40,
    textAlign: 'left',
    padding: 0,
    margin: 0,
  },
  cursor: {
    width: 3,
    height: 50,
    backgroundColor: Colors.neonGreen,
    marginLeft: 2,
  },
});

export default AmountInput;
