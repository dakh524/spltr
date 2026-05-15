import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

interface AnimatedAmountProps {
  amount: number;
  style?: any;
}

const AnimatedAmount: React.FC<AnimatedAmountProps> = ({ amount, style }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = amount;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayAmount(end);
        clearInterval(timer);
      } else {
        setDisplayAmount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [amount]);

  return <Text style={style}>₹{displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
};

export default AnimatedAmount;
