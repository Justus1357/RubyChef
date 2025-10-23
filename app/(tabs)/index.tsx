import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Sparkles } from 'lucide-react-native';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import OnboardingScreen from '@/components/OnboardingScreen';
import MealCard from '@/components/MealCard';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { Recipe } from '@/types/meal';

export default function HomeScreen() {
  const {
    isOnboardingComplete,
    isLoading,
    isInitialized,
    mealPlan,
    preferences,
    generateMealPlan,
    swapMeal,
    getTotalCost
  } = useMealPlanner();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  useEffect(() => {
    if (isInitialized && isOnboardingComplete && mealPlan.length === 0) {
      generateMealPlan();
    }
  }, [isInitialized, isOnboardingComplete, generateMealPlan, mealPlan.length]);

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isOnboardingComplete) {
    return <OnboardingScreen />;
  }

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleSwapMeal = (dayId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    swapMeal(dayId, mealType);
    console.log(`Swapped ${mealType} for day ${dayId}`);
  };

  const totalCost = getTotalCost();
  const budget = preferences.budgetPerWeek ?? 0;
  const overBudgetAmount = Math.max(0, totalCost - budget);
  const isOverBudget = totalCost > budget;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Week</Text>
          <Text style={styles.subtitle}>
            {isOverBudget ? 'Over budget by' : 'Total cost'}: €{(isOverBudget ? overBudgetAmount : totalCost).toFixed(2)}
            {isOverBudget && ` (Budget: €${budget})`}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.regenerateButton} onPress={generateMealPlan}>
          <Sparkles size={20} color="#fff" />
          <Text style={styles.regenerateText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mealPlan.map((day) => (
          <View key={day.id} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Calendar size={20} color="#001f3f" />
              <Text style={styles.dayTitle}>{day.date}</Text>
            </View>

            <View style={styles.mealsContainer}>
              {day.breakfast && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Breakfast</Text>
                  <MealCard
                    recipe={day.breakfast}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(day.id, 'breakfast')}
                    onPress={() => handleRecipePress(day.breakfast!)}
                    dayId={day.id}
                    mealType="breakfast"
                  />
                </View>
              )}

              {day.lunch && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Lunch</Text>
                  <MealCard
                    recipe={day.lunch}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(day.id, 'lunch')}
                    onPress={() => handleRecipePress(day.lunch!)}
                    dayId={day.id}
                    mealType="lunch"
                  />
                </View>
              )}

              {day.dinner && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Dinner</Text>
                  <MealCard
                    recipe={day.dinner}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(day.id, 'dinner')}
                    onPress={() => handleRecipePress(day.dinner!)}
                    dayId={day.id}
                    mealType="dinner"
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
      />
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D1F3C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dayContainer: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  mealsContainer: {
    gap: 16,
  },
  mealSection: {
    gap: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
});