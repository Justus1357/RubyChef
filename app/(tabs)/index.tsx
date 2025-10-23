import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Calendar, Sparkles, ChefHat } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import OnboardingScreen from '@/components/OnboardingScreen';
import MealCard from '@/components/MealCard';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { Recipe } from '@/types/meal';
import { recipes } from '@/data/recipes';

export default function HomeScreen() {
  const mealPlannerContext = useMealPlanner();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '75' | '50' | 'new' | 'budget'>('all');
  
  const isOnboardingComplete = mealPlannerContext?.isOnboardingComplete ?? false;
  const isLoading = mealPlannerContext?.isLoading ?? false;
  const isInitialized = mealPlannerContext?.isInitialized ?? false;
  const mealPlan = mealPlannerContext?.mealPlan ?? [];
  const preferences = mealPlannerContext?.preferences ?? { persons: 2, budgetPerWeek: 100 };
  const generateMealPlan = mealPlannerContext?.generateMealPlan ?? (() => {});
  const swapMeal = mealPlannerContext?.swapMeal ?? (() => {});
  const getTotalCost = mealPlannerContext?.getTotalCost ?? (() => 0);
  const generateGroceryList = mealPlannerContext?.generateGroceryList ?? (() => []);

  const cookableRecipes = useMemo(() => {
    const groceryList = generateGroceryList();
    const ingredientsInPlan = new Set(
      groceryList.map(item => item.name.toLowerCase())
    );

    return recipes.map(recipe => {
      if (!recipe?.ingredients) {
        return { recipe, available: 0, total: 0, percentage: 0 };
      }

      const total = recipe.ingredients.length;
      const available = recipe.ingredients.filter(ing =>
        ingredientsInPlan.has(ing.name.toLowerCase())
      ).length;
      const percentage = Math.round((available / total) * 100);

      return { recipe, available, total, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [generateGroceryList]);

  const filteredCookableRecipes = useMemo(() => {
    let filtered = cookableRecipes;

    switch (selectedFilter) {
      case '75':
        filtered = cookableRecipes.filter(r => r.percentage >= 75);
        break;
      case '50':
        filtered = cookableRecipes.filter(r => r.percentage >= 50);
        break;
      case 'new':
        filtered = cookableRecipes.slice(0, 10);
        break;
      case 'budget':
        filtered = [...cookableRecipes].sort((a, b) => {
          const costA = a.recipe.ingredients?.reduce((sum, ing) => sum + (ing.price || 0), 0) || 0;
          const costB = b.recipe.ingredients?.reduce((sum, ing) => sum + (ing.price || 0), 0) || 0;
          return costA - costB;
        });
        break;
      default:
        break;
    }

    return filtered.slice(0, 20);
  }, [cookableRecipes, selectedFilter]);

  const totalCost = useMemo(() => getTotalCost(), [getTotalCost]);
  const budget = preferences.budgetPerWeek ?? 0;
  const overBudgetAmount = Math.max(0, totalCost - budget);
  const isOverBudget = totalCost > budget;

  const listData = useMemo((): ({
    type: 'header';
  } | {
    type: 'filters';
  } | {
    type: 'cookable-header';
  } | {
    type: 'cookable-recipe';
    data: typeof filteredCookableRecipes[0];
  } | {
    type: 'meal-plan-header';
  } | {
    type: 'day';
    data: typeof mealPlan[0];
  })[] => {
    const items = [
      { type: 'header' as const },
      { type: 'cookable-header' as const },
      { type: 'filters' as const },
      ...filteredCookableRecipes.map(r => ({ type: 'cookable-recipe' as const, data: r })),
      { type: 'meal-plan-header' as const },
      ...mealPlan.map(day => ({ type: 'day' as const, data: day }))
    ];
    return items;
  }, [filteredCookableRecipes, mealPlan]);

  useEffect(() => {
    if (isInitialized && isOnboardingComplete && mealPlan.length === 0) {
      generateMealPlan();
    }
  }, [isInitialized, isOnboardingComplete, generateMealPlan, mealPlan.length]);

  if (!mealPlannerContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    swapMeal(dayId, mealType);
    console.log(`Swapped ${mealType} for day ${dayId}`);
  };

  const handleFilterPress = (filter: typeof selectedFilter) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFilter(filter);
  };

  const renderItem = ({ item }: { item: typeof listData[0] }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Your Week</Text>
              <Text style={styles.subtitle}>
                {isOverBudget ? 'Over budget by' : 'Total cost'}: €{(isOverBudget ? overBudgetAmount : totalCost).toFixed(2)}
                {isOverBudget && ` (Budget: €${budget})`}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.regenerateButton} 
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                generateMealPlan();
              }}
            >
              <Sparkles size={20} color="#fff" />
              <Text style={styles.regenerateText}>New Plan</Text>
            </TouchableOpacity>
          </View>
        );

      case 'cookable-header':
        return (
          <View style={styles.sectionHeader}>
            <ChefHat size={24} color="#6D1F3C" />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Cookable Now</Text>
              <Text style={styles.sectionSubtitle}>Recipes you can make with your planned ingredients</Text>
            </View>
          </View>
        );

      case 'filters':
        return (
          <View style={styles.filtersContainer}>
            {[
              { key: 'all', label: 'All' },
              { key: '75', label: '75%+' },
              { key: '50', label: '50%+' },
              { key: 'new', label: 'New' },
              { key: 'budget', label: 'Budget' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipSelected
                ]}
                onPress={() => handleFilterPress(filter.key as typeof selectedFilter)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter.key && styles.filterChipTextSelected
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'cookable-recipe':
        return (
          <TouchableOpacity
            style={styles.cookableRecipeCard}
            onPress={() => handleRecipePress(item.data.recipe)}
          >
            <View style={styles.cookableRecipeInfo}>
              <Text style={styles.cookableRecipeName}>{item.data.recipe.name}</Text>
              <Text style={styles.cookableRecipeIngredients}>
                You have {item.data.available} of {item.data.total} ingredients
              </Text>
            </View>
            <View style={[
              styles.cookableRecipeBadge,
              item.data.percentage >= 75 && styles.cookableRecipeBadgeGreen,
              item.data.percentage >= 50 && item.data.percentage < 75 && styles.cookableRecipeBadgeOrange
            ]}>
              <Text style={styles.cookableRecipeBadgeText}>{item.data.percentage}%</Text>
            </View>
          </TouchableOpacity>
        );

      case 'meal-plan-header':
        return (
          <View style={styles.mealPlanHeaderContainer}>
            <Calendar size={20} color="#6D1F3C" />
            <Text style={styles.mealPlanHeaderText}>Weekly Meal Plan</Text>
          </View>
        );

      case 'day':
        return (
          <View style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Calendar size={20} color="#001f3f" />
              <Text style={styles.dayTitle}>{item.data.date}</Text>
            </View>

            <View style={styles.mealsContainer}>
              {item.data.breakfast && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Breakfast</Text>
                  <MealCard
                    recipe={item.data.breakfast}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(item.data.id, 'breakfast')}
                    onPress={() => handleRecipePress(item.data.breakfast!)}
                    dayId={item.data.id}
                    mealType="breakfast"
                  />
                </View>
              )}

              {item.data.lunch && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Lunch</Text>
                  <MealCard
                    recipe={item.data.lunch}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(item.data.id, 'lunch')}
                    onPress={() => handleRecipePress(item.data.lunch!)}
                    dayId={item.data.id}
                    mealType="lunch"
                  />
                </View>
              )}

              {item.data.dinner && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>Dinner</Text>
                  <MealCard
                    recipe={item.data.dinner}
                    servings={preferences.persons}
                    onSwap={() => handleSwapMeal(item.data.id, 'dinner')}
                    onPress={() => handleRecipePress(item.data.dinner!)}
                    dayId={item.data.id}
                    mealType="dinner"
                  />
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        estimatedItemSize={200}
        keyExtractor={(item, index) => {
          if (item.type === 'day') return item.data.id;
          if (item.type === 'cookable-recipe') return `cookable-${item.data.recipe.id}`;
          return `${item.type}-${index}`;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flashListContent}
      />

      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
      />
    </View>
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
  flashListContent: {
    paddingBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipSelected: {
    backgroundColor: '#6D1F3C',
    borderColor: '#6D1F3C',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  cookableRecipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cookableRecipeInfo: {
    flex: 1,
    marginRight: 12,
  },
  cookableRecipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cookableRecipeIngredients: {
    fontSize: 13,
    color: '#666',
  },
  cookableRecipeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
  },
  cookableRecipeBadgeGreen: {
    backgroundColor: '#10b981',
  },
  cookableRecipeBadgeOrange: {
    backgroundColor: '#f59e0b',
  },
  cookableRecipeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  mealPlanHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 8,
  },
  mealPlanHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  dayContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
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
