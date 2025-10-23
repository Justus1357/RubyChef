import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 100, 
  borderRadius = 12,
  style 
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function MealCardSkeleton() {
  return (
    <View style={styles.mealCardContainer}>
      <SkeletonLoader height={180} borderRadius={16} />
      <View style={styles.mealCardContent}>
        <SkeletonLoader width="70%" height={20} borderRadius={6} />
        <SkeletonLoader width="50%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
        <View style={styles.mealCardFooter}>
          <SkeletonLoader width={80} height={30} borderRadius={20} />
          <SkeletonLoader width={60} height={30} borderRadius={20} />
        </View>
      </View>
    </View>
  );
}

export function GroceryItemSkeleton() {
  return (
    <View style={styles.groceryItem}>
      <View style={styles.groceryItemLeft}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <View style={styles.groceryItemText}>
          <SkeletonLoader width={120} height={16} borderRadius={6} />
          <SkeletonLoader width={80} height={14} borderRadius={6} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonLoader width={60} height={20} borderRadius={6} />
    </View>
  );
}

export function RecipeCardSkeleton() {
  return (
    <View style={styles.recipeCard}>
      <SkeletonLoader width={120} height={120} borderRadius={12} />
      <View style={styles.recipeCardContent}>
        <SkeletonLoader width="80%" height={18} borderRadius={6} />
        <SkeletonLoader width="60%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
        <SkeletonLoader width={100} height={14} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e9ecef',
  },
  mealCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  mealCardContent: {
    padding: 16,
  },
  mealCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  groceryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groceryItemText: {
    flex: 1,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  recipeCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
