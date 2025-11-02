import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThumbsUp, ThumbsDown, Minus, ChefHat } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Recipe, TasteProfileResponse } from '@/types/meal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface TasteProfileQuizProps {
  recipes: Recipe[];
  onComplete: (responses: TasteProfileResponse[]) => void;
  onSkip?: () => void;
}

export default function TasteProfileQuiz({ recipes, onComplete, onSkip }: TasteProfileQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<TasteProfileResponse[]>([]);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const currentRecipe = recipes[currentIndex];
  const progress = ((currentIndex / recipes.length) * 100).toFixed(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        
        const rotationValue = gesture.dx / SCREEN_WIDTH;
        rotation.setValue(rotationValue);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipe('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipe('dislike');
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          handleSwipe('neutral');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
    Animated.spring(rotation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleSwipe = (response: 'like' | 'neutral' | 'dislike') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const direction = response === 'like' ? 1 : response === 'dislike' ? -1 : 0;
    const toValue = direction === 0 
      ? { x: 0, y: -SCREEN_WIDTH * 1.5 }
      : { x: direction * SCREEN_WIDTH * 1.5, y: 0 };

    Animated.parallel([
      Animated.timing(position, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: direction * 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newResponse: TasteProfileResponse = {
        recipeId: currentRecipe.id,
        recipeName: currentRecipe.name,
        response,
        tags: currentRecipe.tags || [],
        cuisine: currentRecipe.cuisine,
        diet: currentRecipe.tags?.includes('vegan') ? 'vegan' : 
              currentRecipe.tags?.includes('vegetarian') ? 'vegetarian' : 'any',
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      if (currentIndex + 1 >= recipes.length) {
        onComplete(updatedResponses);
      } else {
        setCurrentIndex(currentIndex + 1);
        position.setValue({ x: 0, y: 0 });
        rotation.setValue(0);
      }
    });
  };

  const handleButtonPress = (response: 'like' | 'neutral' | 'dislike') => {
    handleSwipe(response);
  };

  const rotate = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const getDietBadgeColor = (diet: string) => {
    if (diet === 'vegan') return '#10b981';
    if (diet === 'vegetarian') return '#3b82f6';
    return '#6D1F3C';
  };

  const dietTag = currentRecipe.tags?.includes('vegan') ? 'vegan' : 
                  currentRecipe.tags?.includes('vegetarian') ? 'vegetarian' : 'omnivore';

  if (!currentRecipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ChefHat size={60} color="#6D1F3C" />
          <Text style={styles.loadingText}>Preparing your taste quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Build Your Taste Profile</Text>
            <Text style={styles.subtitle}>
              Swipe to tell us what you like
            </Text>
          </View>
          {onSkip && (
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {recipes.length}
          </Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
        >
          <Image source={{ uri: currentRecipe.image }} style={styles.cardImage} />
          
          <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>LOVE IT</Text>
          </Animated.View>

          <Animated.View style={[styles.dislikeStamp, { opacity: dislikeOpacity }]}>
            <Text style={styles.stampText}>PASS</Text>
          </Animated.View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>{currentRecipe.name}</Text>
              <View 
                style={[
                  styles.dietBadge, 
                  { backgroundColor: getDietBadgeColor(dietTag) }
                ]}
              >
                <Text style={styles.dietBadgeText}>{dietTag}</Text>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cuisine</Text>
                <Text style={styles.detailValue}>{currentRecipe.cuisine}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{currentRecipe.cookTime}m</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Calories</Text>
                <Text style={styles.detailValue}>{currentRecipe.nutrition.calories}</Text>
              </View>
            </View>

            <View style={styles.tagsContainer}>
              {currentRecipe.tags?.slice(0, 4).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {currentIndex + 1 < recipes.length && (
          <View style={[styles.card, styles.nextCard]}>
            <Image 
              source={{ uri: recipes[currentIndex + 1].image }} 
              style={styles.cardImage} 
            />
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.instructionRow}>
          <Text style={styles.instructionText}>Swipe right to like</Text>
          <Text style={styles.instructionSeparator}>•</Text>
          <Text style={styles.instructionText}>Swipe left to dislike</Text>
          <Text style={styles.instructionSeparator}>•</Text>
          <Text style={styles.instructionText}>Swipe up for neutral</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dislikeButton]}
            onPress={() => handleButtonPress('dislike')}
          >
            <ThumbsDown size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.neutralButton]}
            onPress={() => handleButtonPress('neutral')}
          >
            <Minus size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleButtonPress('like')}
          >
            <ThumbsUp size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#6D1F3C',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: '75%',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'absolute' as const,
  },
  nextCard: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  cardImage: {
    width: '100%',
    height: '60%',
    backgroundColor: '#e9ecef',
  },
  cardInfo: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dietBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dietBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9ecef',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  likeStamp: {
    position: 'absolute' as const,
    top: 60,
    right: 30,
    transform: [{ rotate: '15deg' }],
    borderWidth: 6,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dislikeStamp: {
    position: 'absolute' as const,
    top: 60,
    left: 30,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 6,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stampText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
  },
  instructionSeparator: {
    fontSize: 12,
    color: '#ccc',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dislikeButton: {
    backgroundColor: '#ef4444',
  },
  neutralButton: {
    backgroundColor: '#9ca3af',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  likeButton: {
    backgroundColor: '#10b981',
  },
});
