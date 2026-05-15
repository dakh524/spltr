import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Utensils, Car, Home, Film, Grid } from 'lucide-react-native';
import { CategoryColors } from '../constants/Colors';
import { Category } from '../types';

interface CategoryIconProps {
  category: Category;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 40 }) => {
  const color = CategoryColors[category];
  const iconSize = size * 0.5;

  const renderIcon = () => {
    switch (category) {
      case 'food':
        return <Utensils color={color} size={iconSize} />;
      case 'travel':
        return <Car color={color} size={iconSize} />;
      case 'home':
        return <Home color={color} size={iconSize} />;
      case 'entertainment':
        return <Film color={color} size={iconSize} />;
      default:
        return <Grid color={color} size={iconSize} />;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: color + '20' }]}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryIcon;
