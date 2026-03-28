import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { recipes, loadRecipes } from '@/data/recipes';
import { UserPreferences, MealPlan, GroceryItem, Recipe, TasteProfile, TasteProfileResponse } from '@/types/meal';

const defaultPreferences: UserPreferences = {
  diet: 'any',
  mealMix: 'balanced',
  persons: 2,
  householdMembers: [],
  budgetPerWeek: 100,
  maxTimePerMeal: 30,
  maxTimeBreakfast: 15,
  maxTimeLunch: 30,
  maxTimeDinner: 45,
  allergies: [],
  dislikes: [],
  goals: ['healthy'],
  notes: '',
  eatingOutDays: [],
  postalCode: undefined,
  nearbySupermarkets: undefined,
  selectedSupermarket: undefined,
  unitSystem: 'metric'
};

export const [MealPlannerProvider, useMealPlanner] = createContextHook(() => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [isTasteProfileComplete, setIsTasteProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [removedRecipeIds, setRemovedRecipeIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Starting data load...');
      
      // Load recipes in background without blocking
      loadRecipes().catch(error => {
        console.error('⚠️ Recipe loading failed:', error);
        console.log('📦 Continuing with simple breakfasts only');
      });
      
      try {
        const [storedPreferences, storedMealPlan, storedOnboarding, storedRemovedRecipes, storedTasteProfile, storedTasteProfileComplete] = await Promise.all([
          AsyncStorage.getItem('meal_preferences').catch(() => null),
          AsyncStorage.getItem('meal_plan').catch(() => null),
          AsyncStorage.getItem('onboarding_complete').catch(() => null),
          AsyncStorage.getItem('removed_recipe_ids').catch(() => null),
          AsyncStorage.getItem('taste_profile').catch(() => null),
          AsyncStorage.getItem('taste_profile_complete').catch(() => null)
        ]);

        if (storedPreferences) {
          try {
            const parsed = JSON.parse(storedPreferences);
            if (parsed && typeof parsed === 'object') {
              setPreferences(parsed);
              console.log('✅ Loaded preferences');
            } else {
              console.warn('⚠️ Invalid preferences format, clearing');
              await AsyncStorage.removeItem('meal_preferences');
            }
          } catch (e) {
            console.error('❌ Failed to parse preferences:', e);
            await AsyncStorage.removeItem('meal_preferences');
          }
        }
        
        if (storedMealPlan) {
          try {
            const parsed = JSON.parse(storedMealPlan);
            if (Array.isArray(parsed)) {
              setMealPlan(parsed);
              console.log('✅ Loaded meal plan');
            } else {
              console.warn('⚠️ Invalid meal plan format, clearing');
              await AsyncStorage.removeItem('meal_plan');
            }
          } catch (e) {
            console.error('❌ Failed to parse meal plan:', e);
            await AsyncStorage.removeItem('meal_plan');
          }
        }
        
        if (storedOnboarding) {
          try {
            const parsed = JSON.parse(storedOnboarding);
            if (typeof parsed === 'boolean') {
              setIsOnboardingComplete(parsed);
              console.log('✅ Loaded onboarding status');
            } else {
              console.warn('⚠️ Invalid onboarding format, clearing');
              await AsyncStorage.removeItem('onboarding_complete');
            }
          } catch (e) {
            console.error('❌ Failed to parse onboarding:', e);
            await AsyncStorage.removeItem('onboarding_complete');
          }
        }
        
        if (storedRemovedRecipes) {
          try {
            const parsed = JSON.parse(storedRemovedRecipes);
            if (Array.isArray(parsed)) {
              setRemovedRecipeIds(new Set(parsed));
              console.log('✅ Loaded removed recipe IDs:', parsed.length);
            } else {
              console.warn('⚠️ Invalid removed recipes format, clearing');
              await AsyncStorage.removeItem('removed_recipe_ids');
            }
          } catch (e) {
            console.error('❌ Failed to parse removed recipes:', e);
            await AsyncStorage.removeItem('removed_recipe_ids');
          }
        }
        
        if (storedTasteProfile) {
          try {
            const parsed = JSON.parse(storedTasteProfile);
            if (parsed && typeof parsed === 'object') {
              setTasteProfile(parsed);
              console.log('✅ Loaded taste profile');
            } else {
              console.warn('⚠️ Invalid taste profile format, clearing');
              await AsyncStorage.removeItem('taste_profile');
            }
          } catch (e) {
            console.error('❌ Failed to parse taste profile:', e);
            await AsyncStorage.removeItem('taste_profile');
          }
        }
        
        if (storedTasteProfileComplete) {
          try {
            const parsed = JSON.parse(storedTasteProfileComplete);
            if (typeof parsed === 'boolean') {
              setIsTasteProfileComplete(parsed);
              console.log('✅ Loaded taste profile completion status');
            } else {
              console.warn('⚠️ Invalid taste profile completion format, clearing');
              await AsyncStorage.removeItem('taste_profile_complete');
            }
          } catch (e) {
            console.error('❌ Failed to parse taste profile completion:', e);
            await AsyncStorage.removeItem('taste_profile_complete');
          }
        }
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
      }
    } catch (error) {
      console.error('❌ Critical error in loadData:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      console.log('✅ Initialization complete');
    }
  }, [isInitialized]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePreferences = useCallback(async (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    await AsyncStorage.setItem('meal_preferences', JSON.stringify(newPreferences));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboardingComplete(true);
    await AsyncStorage.setItem('onboarding_complete', JSON.stringify(true));
  }, []);

  const generateMealPlan = useCallback(() => {
    const now = new Date();
    const currentDayIndex = now.getDay();
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const days = [
      ...allDays.slice(currentDayIndex),
      ...allDays.slice(0, currentDayIndex)
    ];
    
    console.log('Generating meal plan starting from:', days[0], '(current day)');
    const newMealPlan: MealPlan[] = [];

    // Target calories per day and per meal
    const TARGET_DAILY_CALORIES = 2000;
    const TARGET_BREAKFAST_CALORIES = 500;  // 25% of daily
    const TARGET_LUNCH_CALORIES = 650;      // 32.5% of daily
    const TARGET_DINNER_CALORIES = 850;     // 42.5% of daily
    
    // Helper to round amounts to nice numbers
    const roundToNiceNumber = (amount: number): number => {
      if (amount < 50) return Math.round(amount / 5) * 5; // Round to nearest 5
      if (amount < 100) return Math.round(amount / 10) * 10; // Round to nearest 10
      if (amount < 500) return Math.round(amount / 25) * 25; // Round to nearest 25
      return Math.round(amount / 50) * 50; // Round to nearest 50
    };

    // Filter recipes based on user preferences
    const filterRecipes = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
      let filteredRecipes = recipes.filter(r => r.mealType === mealType && !removedRecipeIds.has(r.id));
      
      // Filter by cook time based on meal type
      const maxTime = mealType === 'breakfast' ? preferences.maxTimeBreakfast :
                      mealType === 'lunch' ? preferences.maxTimeLunch :
                      preferences.maxTimeDinner;
      filteredRecipes = filteredRecipes.filter(r => r.cookTime <= maxTime);
      
      // Filter by allergies
      if (preferences.allergies.length > 0) {
        filteredRecipes = filteredRecipes.filter(r => 
          r && r.ingredients && !r.ingredients.some(ingredient => 
            preferences.allergies.some(allergy => 
              ingredient.name.toLowerCase().includes(allergy.toLowerCase())
            )
          )
        );
      }
      
      // Filter by dislikes
      if (preferences.dislikes.length > 0) {
        filteredRecipes = filteredRecipes.filter(r => 
          r && r.name && r.ingredients && !preferences.dislikes.some(dislike => 
            r.name.toLowerCase().includes(dislike.toLowerCase()) ||
            r.ingredients.some(ingredient => 
              ingredient.name.toLowerCase().includes(dislike.toLowerCase())
            )
          )
        );
      }
      
      // Filter by meal mix preference
      if (preferences.mealMix === 'more-meat') {
        // Prioritize recipes with meat-focused tags or high protein
        filteredRecipes = filteredRecipes.filter(r => 
          r && r.ingredients && (
            (r.tags && (r.tags.includes('meat-focused') || r.tags.includes('high-protein'))) ||
            r.ingredients.some(ingredient => 
              ['Meat', 'Fish', 'Seafood'].includes(ingredient.category)
            )
          )
        );
      } else if (preferences.mealMix === 'more-veg') {
        // Prioritize vegetarian/vegan recipes
        filteredRecipes = filteredRecipes.filter(r => 
          r && r.ingredients && (
            (r.tags && (r.tags.includes('vegetarian') || r.tags.includes('vegan'))) ||
            !r.ingredients.some(ingredient => 
              ['Meat', 'Fish', 'Seafood'].includes(ingredient.category)
            )
          )
        );
      }
      
      // Filter by calorie targets for each meal type
      let targetCalories = TARGET_BREAKFAST_CALORIES;
      let calorieRange = 200; // Allow ±200 calorie variance for flexibility
      
      if (mealType === 'lunch') {
        targetCalories = TARGET_LUNCH_CALORIES;
        calorieRange = 200;
      } else if (mealType === 'dinner') {
        targetCalories = TARGET_DINNER_CALORIES;
        calorieRange = 250;
      }
      
      // Prioritize recipes within the target calorie range
      const recipesInRange = filteredRecipes.filter(r => 
        r.nutrition && 
        r.nutrition.calories >= targetCalories - calorieRange &&
        r.nutrition.calories <= targetCalories + calorieRange
      );
      
      // If we have enough recipes in range, use those; otherwise use all filtered
      if (recipesInRange.length >= 5) {
        filteredRecipes = recipesInRange;
        console.log(`${mealType}: Found ${recipesInRange.length} recipes in calorie range ${targetCalories - calorieRange}-${targetCalories + calorieRange}`);
      } else {
        // Sort by proximity to target calories
        filteredRecipes = filteredRecipes.sort((a, b) => {
          const diffA = Math.abs((a.nutrition?.calories || 0) - targetCalories);
          const diffB = Math.abs((b.nutrition?.calories || 0) - targetCalories);
          return diffA - diffB;
        });
        // Take top 60% closest to target for more options
        if (filteredRecipes.length > 10) {
          filteredRecipes = filteredRecipes.slice(0, Math.ceil(filteredRecipes.length * 0.6));
        }
        console.log(`${mealType}: Limited recipes in range, using ${filteredRecipes.length} closest to ${targetCalories} calories`);
      }
      
      // Filter by budget goals - prioritize cheaper meals
      if (preferences.goals.includes('budget')) {
        // Sort by cost per serving and prefer cheaper options
        filteredRecipes = filteredRecipes.filter(r => r && r.ingredients && r.servings).sort((a, b) => {
          const costA = a.ingredients.reduce((sum, ing) => sum + (ing.price || 0), 0) / a.servings;
          const costB = b.ingredients.reduce((sum, ing) => sum + (ing.price || 0), 0) / b.servings;
          return costA - costB;
        });
        
        // Take only the cheaper 40% for more aggressive budget savings
        if (filteredRecipes.length > 10) {
          filteredRecipes = filteredRecipes.slice(0, Math.ceil(filteredRecipes.length * 0.4));
        }
      }
      
      return filteredRecipes;
    };

    const breakfastRecipes = filterRecipes('breakfast');
    const lunchRecipes = filterRecipes('lunch');
    const dinnerRecipes = filterRecipes('dinner');

    console.log('Filtered recipes:', {
      breakfast: breakfastRecipes.length,
      lunch: lunchRecipes.length,
      dinner: dinnerRecipes.length,
      preferences: preferences
    });

    // Shuffle arrays to get random selection
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledBreakfast = shuffleArray(breakfastRecipes);
    const shuffledLunch = shuffleArray(lunchRecipes);
    const shuffledDinner = shuffleArray(dinnerRecipes);

    // Generate meal plan with budget constraints and variety tracking
    let totalWeeklyCost = 0;
    const targetCostPerDay = preferences.budgetPerWeek / 7;
    const usedRecipeIds = new Set<string>();
    const budgetEnabled = preferences.goals.includes('budget');
    
    // Track ingredients across the week to minimize waste
    const weeklyIngredientUsage = new Map<string, {
      totalUsed: number;
      packageSize: number;
      category: string;
      price: number;
      needsMoreUse: boolean;
    }>();
    
    // Helper to calculate leftover score (lower is better)
    const calculateLeftoverScore = (recipe: any) => {
      if (!recipe?.ingredients) return 1000;
      
      let totalLeftoverPercentage = 0;
      let leftoverCount = 0;
      
      recipe.ingredients.forEach((ing: any) => {
        const scaledAmount = (ing.amount * preferences.persons) / recipe.servings;
        const packageSize = ing.packageSize || scaledAmount;
        const packagesNeeded = Math.ceil(scaledAmount / packageSize);
        const totalBought = packagesNeeded * packageSize;
        const leftover = totalBought - scaledAmount;
        
        if (leftover > 0.1) {
          const leftoverPercentage = (leftover / totalBought) * 100;
          totalLeftoverPercentage += leftoverPercentage;
          leftoverCount++;
        }
      });
      
      return leftoverCount > 0 ? totalLeftoverPercentage / leftoverCount : 0;
    };
    
    // Helper to calculate ingredient reuse score (higher is better)
    const calculateReuseScore = (recipe: any) => {
      if (!recipe?.ingredients) return 0;
      
      let reuseScore = 0;
      recipe.ingredients.forEach((ing: any) => {
        const key = ing.name.toLowerCase();
        const existing = weeklyIngredientUsage.get(key);
        
        if (existing) {
          const scaledAmount = (ing.amount * preferences.persons) / recipe.servings;
          const totalWithThis = existing.totalUsed + scaledAmount;
          const packageSize = existing.packageSize;
          const packagesNeeded = Math.ceil(totalWithThis / packageSize);
          const totalBought = packagesNeeded * packageSize;
          const wouldUse = totalWithThis;
          const usagePercentage = (wouldUse / totalBought) * 100;
          
          // Massive bonus for meat/protein reuse - these are expensive and come in large packages
          const isMeatOrProtein = ['Meat', 'Fish', 'Seafood'].includes(existing.category);
          const isExpensive = existing.price > 2.0;
          
          if (isMeatOrProtein) {
            // CRITICAL: Strongly prioritize using meat/fish that's already in the plan
            reuseScore += 100;
            
            // Extra bonus if we're getting close to using the full package
            if (usagePercentage > 70) {
              reuseScore += 50;
            } else if (usagePercentage > 50) {
              reuseScore += 30;
            }
          } else if (isExpensive) {
            reuseScore += 40;
            if (usagePercentage > 70) {
              reuseScore += 20;
            }
          } else {
            // Regular bonus for reusing any ingredient
            reuseScore += 15;
            if (usagePercentage > 80) {
              reuseScore += 10;
            }
          }
          
          // If ingredient is marked as needing more use, give it huge priority
          if (existing.needsMoreUse) {
            reuseScore += 200;
          }
        }
        
        // Bonus for ingredients with large package sizes that aren't in the plan yet
        if (!existing && ing.packageSize && ing.packageSize > 500) {
          const isMeatOrProtein = ['Meat', 'Fish', 'Seafood'].includes(ing.category);
          // Small penalty for introducing new bulk ingredients unless it's early in the week
          if (!isMeatOrProtein) {
            reuseScore -= 5;
          }
        }
      });
      
      return reuseScore;
    };
    
    // Helper function to get next unique recipe with waste reduction optimization
    const getUniqueRecipe = (recipeList: any[], usedIds: Set<string>) => {
      // First try to find unused recipes
      const unusedRecipes = recipeList.filter(r => !usedIds.has(r.id));
      
      if (unusedRecipes.length > 0) {
        // Calculate combined score: minimize leftovers + maximize ingredient reuse
        const scoredRecipes = unusedRecipes.map(recipe => {
          const leftoverScore = calculateLeftoverScore(recipe);
          const reuseScore = calculateReuseScore(recipe);
          
          // Combined score: lower leftover is better, higher reuse is better
          // Normalize: leftover penalty (0-100) - reuse bonus (0-50)
          const combinedScore = leftoverScore - reuseScore;
          
          return { recipe, combinedScore, leftoverScore, reuseScore };
        });
        
        // Sort by combined score (lower is better)
        scoredRecipes.sort((a, b) => a.combinedScore - b.combinedScore);
        
        // Pick from top 30% with best scores
        const topChoices = scoredRecipes.slice(0, Math.max(1, Math.ceil(scoredRecipes.length * 0.3)));
        const selected = topChoices[Math.floor(Math.random() * topChoices.length)].recipe;
        
        // Update weekly ingredient usage with detailed tracking
        selected.ingredients.forEach((ing: any) => {
          const key = ing.name.toLowerCase();
          const scaledAmount = (ing.amount * preferences.persons) / selected.servings;
          const existing = weeklyIngredientUsage.get(key);
          
          if (existing) {
            existing.totalUsed += scaledAmount;
            
            // Check if we still need more of this ingredient to minimize waste
            const packageSize = existing.packageSize;
            const packagesNeeded = Math.ceil(existing.totalUsed / packageSize);
            const totalBought = packagesNeeded * packageSize;
            const usagePercentage = (existing.totalUsed / totalBought) * 100;
            
            // Mark as needing more use if we're using less than 60% of what we'd buy
            const isMeatOrProtein = ['Meat', 'Fish', 'Seafood'].includes(existing.category);
            if (isMeatOrProtein && usagePercentage < 70) {
              existing.needsMoreUse = true;
            } else if (usagePercentage < 50 && existing.packageSize > 300) {
              existing.needsMoreUse = true;
            } else {
              existing.needsMoreUse = false;
            }
          } else {
            weeklyIngredientUsage.set(key, {
              totalUsed: scaledAmount,
              packageSize: ing.packageSize || scaledAmount,
              category: ing.category,
              price: ing.pricePerPackage || ing.price || 0,
              needsMoreUse: true // New ingredients start as needing more use
            });
          }
        });
        
        usedIds.add(selected.id);
        return selected;
      }
      
      // If all recipes have been used, allow reuse but prefer least recently used
      const selected = recipeList[Math.floor(Math.random() * recipeList.length)];
      return selected;
    };
    
    days.forEach((day, index) => {
      // Ensure we have valid recipes before proceeding
      if (shuffledBreakfast.length === 0 || shuffledLunch.length === 0 || shuffledDinner.length === 0) {
        console.warn('Not enough recipes available for meal planning');
        return;
      }
      
      let dayBreakfast = getUniqueRecipe(shuffledBreakfast, usedRecipeIds);
      
      // Check if this day is an eating-out day for lunch
      const isEatingOutDay = preferences.eatingOutDays?.includes(day) ?? false;
      let dayLunch = isEatingOutDay ? null : getUniqueRecipe(shuffledLunch, usedRecipeIds);
      
      let dayDinner = getUniqueRecipe(shuffledDinner, usedRecipeIds);
      
      // Calculate total daily calories (skip lunch if eating out)
      let dailyCalories = (dayBreakfast?.nutrition?.calories || 0) + 
                         (isEatingOutDay ? 0 : (dayLunch?.nutrition?.calories || 0)) + 
                         (dayDinner?.nutrition?.calories || 0);
      
      // If daily calories are too low, try to swap dinner for a higher calorie option (only if not eating out)
      if (!isEatingOutDay && dailyCalories < TARGET_DAILY_CALORIES - 200) {
        const higherCalorieDinners = shuffledDinner.filter(r => 
          r.nutrition && 
          r.nutrition.calories > (dayDinner?.nutrition?.calories || 0) + 100 &&
          !usedRecipeIds.has(r.id)
        );
        
        if (higherCalorieDinners.length > 0) {
          usedRecipeIds.delete(dayDinner.id);
          dayDinner = higherCalorieDinners[0];
          usedRecipeIds.add(dayDinner.id);
          dailyCalories = (dayBreakfast?.nutrition?.calories || 0) + 
                         (dayLunch?.nutrition?.calories || 0) + 
                         (dayDinner?.nutrition?.calories || 0);
        }
      }
      
      const lunchInfo = isEatingOutDay ? 'Eating Out' : `${dayLunch?.name} (${dayLunch?.nutrition?.calories}cal)`;
      console.log(`${day}: ${dayBreakfast?.name} (${dayBreakfast?.nutrition?.calories}cal) + ${lunchInfo} + ${dayDinner?.name} (${dayDinner?.nutrition?.calories}cal) = ${dailyCalories}cal`);
      
      // Calculate meal costs
      const calculateMealCost = (recipe: any) => {
        if (!recipe || !recipe.ingredients || !recipe.servings) {
          console.warn('Invalid recipe for cost calculation:', recipe?.name || 'Unknown');
          return 0;
        }
        return recipe.ingredients.reduce((sum: number, ing: any) => 
          sum + ((ing.price || 0) * preferences.persons / recipe.servings), 0
        );
      };
      
      let dayCost = calculateMealCost(dayBreakfast) + (isEatingOutDay ? 0 : calculateMealCost(dayLunch)) + calculateMealCost(dayDinner);
      
      // Budget enforcement: try to stay within budget if budget goal is enabled
      if (budgetEnabled) {
        const remainingBudget = preferences.budgetPerWeek - totalWeeklyCost;
        const daysRemaining = days.length - index;
        const adjustedDailyBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : targetCostPerDay;
        
        // Allow small flexibility (5%) to avoid being too restrictive
        const maxDailyCost = adjustedDailyBudget * 1.05;
        
        let attempts = 0;
        const maxAttempts = 10;
        
        // Keep trying to find cheaper alternatives if over budget
        while (dayCost > maxDailyCost && attempts < maxAttempts) {
          attempts++;
          let swapped = false;
          
          // Try swapping the most expensive meal first
          const breakfastCost = calculateMealCost(dayBreakfast);
          const lunchCost = isEatingOutDay ? 0 : calculateMealCost(dayLunch);
          const dinnerCost = calculateMealCost(dayDinner);
          
          if (dinnerCost >= breakfastCost && dinnerCost >= lunchCost) {
            // Try cheaper dinner
            const cheaperDinners = shuffledDinner
              .filter(r => calculateMealCost(r) < dinnerCost)
              .filter(r => !usedRecipeIds.has(r.id) || r.id === dayDinner.id)
              .sort((a, b) => calculateMealCost(a) - calculateMealCost(b));
            
            if (cheaperDinners.length > 0) {
              usedRecipeIds.delete(dayDinner.id);
              dayDinner = cheaperDinners[0];
              usedRecipeIds.add(dayDinner.id);
              swapped = true;
            }
          } else if (breakfastCost >= lunchCost) {
            // Try cheaper breakfast
            const cheaperBreakfasts = shuffledBreakfast
              .filter(r => calculateMealCost(r) < breakfastCost)
              .filter(r => !usedRecipeIds.has(r.id) || r.id === dayBreakfast.id)
              .sort((a, b) => calculateMealCost(a) - calculateMealCost(b));
            
            if (cheaperBreakfasts.length > 0) {
              usedRecipeIds.delete(dayBreakfast.id);
              dayBreakfast = cheaperBreakfasts[0];
              usedRecipeIds.add(dayBreakfast.id);
              swapped = true;
            }
          } else if (!isEatingOutDay) {
            // Try cheaper lunch
            const cheaperLunches = shuffledLunch
              .filter(r => calculateMealCost(r) < lunchCost)
              .filter(r => !usedRecipeIds.has(r.id) || r.id === dayLunch.id)
              .sort((a, b) => calculateMealCost(a) - calculateMealCost(b));
            
            if (cheaperLunches.length > 0) {
              usedRecipeIds.delete(dayLunch.id);
              dayLunch = cheaperLunches[0];
              usedRecipeIds.add(dayLunch.id);
              swapped = true;
            }
          }
          
          // Recalculate cost
          dayCost = calculateMealCost(dayBreakfast) + (isEatingOutDay ? 0 : calculateMealCost(dayLunch)) + calculateMealCost(dayDinner);
          
          // If we couldn't swap anything, break to avoid infinite loop
          if (!swapped) {
            console.warn(`Day ${day}: Could not find cheaper alternatives. Cost: €${dayCost.toFixed(2)}, Budget: €${maxDailyCost.toFixed(2)}`);
            break;
          }
        }
        
        console.log(`Day ${day}: Final cost €${dayCost.toFixed(2)} (budget: €${maxDailyCost.toFixed(2)}, attempts: ${attempts})`);
      }
      
      totalWeeklyCost += dayCost;
      
      newMealPlan.push({
        id: `day-${index}-${Date.now()}`,
        date: day,
        breakfast: dayBreakfast,
        lunch: dayLunch,
        dinner: dayDinner
      });
    });

    // Calculate total weekly calories
    const totalWeeklyCalories = newMealPlan.reduce((sum, day) => {
      const dayCalories = (day.breakfast?.nutrition?.calories || 0) + 
                         (day.lunch?.nutrition?.calories || 0) + 
                         (day.dinner?.nutrition?.calories || 0);
      return sum + dayCalories;
    }, 0);
    const avgDailyCalories = totalWeeklyCalories / newMealPlan.length;
    
    const overBudget = totalWeeklyCost > preferences.budgetPerWeek;
    const budgetDifference = totalWeeklyCost - preferences.budgetPerWeek;
    
    console.log('Generated new meal plan:', {
      plan: newMealPlan,
      totalWeeklyCost: totalWeeklyCost.toFixed(2),
      budgetTarget: preferences.budgetPerWeek,
      withinBudget: !overBudget,
      budgetDifference: budgetDifference.toFixed(2),
      overBudgetBy: overBudget ? `€${budgetDifference.toFixed(2)} (${((budgetDifference / preferences.budgetPerWeek) * 100).toFixed(1)}%)` : 'N/A',
      uniqueRecipesUsed: usedRecipeIds.size,
      totalRecipesAvailable: breakfastRecipes.length + lunchRecipes.length + dinnerRecipes.length,
      totalWeeklyCalories: totalWeeklyCalories,
      avgDailyCalories: avgDailyCalories.toFixed(0),
      targetDailyCalories: TARGET_DAILY_CALORIES
    });
    
    setMealPlan(newMealPlan);
    AsyncStorage.setItem('meal_plan', JSON.stringify(newMealPlan));
  }, [preferences, removedRecipeIds]);

  const swapMeal = useCallback((dayId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    // Apply same filtering logic as generateMealPlan
    let availableRecipes = recipes.filter(r => r.mealType === mealType && !removedRecipeIds.has(r.id));
    
    // Filter by cook time based on meal type
    const maxTime = mealType === 'breakfast' ? preferences.maxTimeBreakfast :
                    mealType === 'lunch' ? preferences.maxTimeLunch :
                    preferences.maxTimeDinner;
    availableRecipes = availableRecipes.filter(r => r.cookTime <= maxTime);
    
    // Filter by allergies
    if (preferences.allergies.length > 0) {
      availableRecipes = availableRecipes.filter(r => 
        r && r.ingredients && !r.ingredients.some(ingredient => 
          preferences.allergies.some(allergy => 
            ingredient.name.toLowerCase().includes(allergy.toLowerCase())
          )
        )
      );
    }
    
    // Filter by dislikes
    if (preferences.dislikes.length > 0) {
      availableRecipes = availableRecipes.filter(r => 
        r && r.name && r.ingredients && !preferences.dislikes.some(dislike => 
          r.name.toLowerCase().includes(dislike.toLowerCase()) ||
          r.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(dislike.toLowerCase())
          )
        )
      );
    }
    
    // Filter by meal mix preference
    if (preferences.mealMix === 'more-meat') {
      availableRecipes = availableRecipes.filter(r => 
        r && r.ingredients && (
          (r.tags && (r.tags.includes('meat-focused') || r.tags.includes('high-protein'))) ||
          r.ingredients.some(ingredient => 
            ['Meat', 'Fish', 'Seafood'].includes(ingredient.category)
          )
        )
      );
    } else if (preferences.mealMix === 'more-veg') {
      availableRecipes = availableRecipes.filter(r => 
        r && r.ingredients && (
          (r.tags && (r.tags.includes('vegetarian') || r.tags.includes('vegan'))) ||
          !r.ingredients.some(ingredient => 
            ['Meat', 'Fish', 'Seafood'].includes(ingredient.category)
          )
        )
      );
    }
    
    const currentMeal = mealPlan.find(day => day.id === dayId)?.[mealType];
    
    // Get all currently used recipe IDs in the meal plan (excluding the one we're swapping)
    const usedRecipeIds = new Set<string>();
    mealPlan.forEach(day => {
      if (day.breakfast && day.id !== dayId) usedRecipeIds.add(day.breakfast.id);
      if (day.lunch && day.id !== dayId) usedRecipeIds.add(day.lunch.id);
      if (day.dinner && day.id !== dayId) usedRecipeIds.add(day.dinner.id);
      // For the current day, add the other meals (not the one being swapped)
      if (day.id === dayId) {
        if (mealType !== 'breakfast' && day.breakfast) usedRecipeIds.add(day.breakfast.id);
        if (mealType !== 'lunch' && day.lunch) usedRecipeIds.add(day.lunch.id);
        if (mealType !== 'dinner' && day.dinner) usedRecipeIds.add(day.dinner.id);
      }
    });
    
    // Prefer recipes that aren't already used in the meal plan
    const unusedRecipes = availableRecipes.filter(r => !usedRecipeIds.has(r.id));
    const otherRecipes = unusedRecipes.length > 0 ? unusedRecipes : availableRecipes.filter(r => r.id !== currentMeal?.id);
    
    console.log(`Swapping ${mealType} for day ${dayId}`);
    console.log(`Available ${mealType} recipes:`, availableRecipes.length);
    console.log(`Current meal:`, currentMeal?.name);
    console.log(`Unused recipes available:`, unusedRecipes.length);
    console.log(`Other options:`, otherRecipes.length);
    console.log(`Currently used recipe IDs:`, Array.from(usedRecipeIds));
    
    if (otherRecipes.length === 0) {
      console.warn(`No alternative ${mealType} recipes available`);
      return;
    }
    
    // If budget is a goal, prefer cheaper options
    let newRecipe;
    if (preferences.goals.includes('budget')) {
      const validRecipes = otherRecipes.filter(r => r && r.ingredients && r.servings);
      if (validRecipes.length === 0) {
        console.warn(`No valid recipes available for ${mealType} swap`);
        return;
      }
      
      const sortedByPrice = validRecipes.sort((a, b) => {
        const costA = a.ingredients.reduce((sum, ing) => sum + (ing.price || 0), 0) / a.servings;
        const costB = b.ingredients.reduce((sum, ing) => sum + (ing.price || 0), 0) / b.servings;
        return costA - costB;
      });
      // Pick from cheaper half
      const cheaperHalf = sortedByPrice.slice(0, Math.max(1, Math.ceil(sortedByPrice.length / 2)));
      newRecipe = cheaperHalf[Math.floor(Math.random() * cheaperHalf.length)];
    } else {
      if (otherRecipes.length === 0) {
        console.warn(`No alternative recipes available for ${mealType} swap`);
        return;
      }
      newRecipe = otherRecipes[Math.floor(Math.random() * otherRecipes.length)];
    }
    
    console.log(`New recipe selected:`, newRecipe?.name || 'None');
    
    if (!newRecipe) {
      console.error('Failed to select a new recipe for swap');
      return;
    }

    const updatedMealPlan = mealPlan.map(day => {
      if (day.id === dayId) {
        return { ...day, [mealType]: newRecipe };
      }
      return day;
    });

    setMealPlan(updatedMealPlan);
    AsyncStorage.setItem('meal_plan', JSON.stringify(updatedMealPlan));
  }, [mealPlan, preferences, removedRecipeIds]);

  const generateGroceryList = useCallback((): GroceryItem[] => {
    console.log('\n🛒 Generating grocery list for', mealPlan.length, 'days,', preferences.persons, 'persons');

    // Helper to round amounts to nice numbers
    const roundToNiceNumber = (amount: number): number => {
      if (amount < 50) return Math.round(amount / 5) * 5; // Round to nearest 5
      if (amount < 100) return Math.round(amount / 10) * 10; // Round to nearest 10
      if (amount < 500) return Math.round(amount / 25) * 25; // Round to nearest 25
      return Math.round(amount / 50) * 50; // Round to nearest 50
    };

    const ingredientMap = new Map<string, {
      name: string;
      category: string;
      unit: string;
      totalAmount: number;
      usedInRecipes: Set<string>;
      packageSize: number;
      pricePerPackage: number;
    }>();

    mealPlan.forEach((day) => {
      // Skip lunch if it's an eating-out day
      const isEatingOutDay = preferences.eatingOutDays?.includes(day.date) ?? false;
      const meals = isEatingOutDay 
        ? [day.breakfast, day.dinner].filter(Boolean) as Recipe[]
        : [day.breakfast, day.lunch, day.dinner].filter(Boolean) as Recipe[];

      meals.forEach((recipe) => {
        if (!recipe?.ingredients) return;

        recipe.ingredients.forEach((ingredient) => {
          if (!ingredient?.name) return;

          const key = `${ingredient.name.toLowerCase()}|||${ingredient.unit}`;
          let scaledAmount = (ingredient.amount * preferences.persons) / recipe.servings;
          
          // Round to nice numbers
          scaledAmount = roundToNiceNumber(scaledAmount);

          console.log(`  ${recipe.name}: ${ingredient.name} = ${ingredient.amount}${ingredient.unit} for ${recipe.servings} servings → ${scaledAmount}${ingredient.unit} for ${preferences.persons} persons`);

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.totalAmount += scaledAmount;
            existing.usedInRecipes.add(recipe.name);
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              category: ingredient.category,
              unit: ingredient.unit,
              totalAmount: scaledAmount,
              usedInRecipes: new Set([recipe.name]),
              packageSize: ingredient.packageSize || 0,
              pricePerPackage: ingredient.pricePerPackage || 0
            });
          }
        });
      });
    });

    console.log('\n📊 Aggregated ingredients:');
    ingredientMap.forEach((item, key) => {
      console.log(`  ${item.name}: ${item.totalAmount.toFixed(1)}${item.unit} (used in ${item.usedInRecipes.size} recipes)`);
    });

    const groceryList: GroceryItem[] = Array.from(ingredientMap.entries()).map(([key, item], idx) => {
      // Round total amount to nice number
      const roundedAmount = roundToNiceNumber(item.totalAmount);
      
      // Calculate how many packages we need to buy
      const packagesNeeded = Math.ceil(roundedAmount / item.packageSize);
      const actualPrice = packagesNeeded * item.pricePerPackage;
      
      console.log(`  ${item.name}: Need ${roundedAmount}${item.unit}, package size: ${item.packageSize}${item.unit}, packages needed: ${packagesNeeded}, price: €${actualPrice.toFixed(2)}`);
      
      return {
        id: `grocery-${idx}-${Date.now()}`,
        name: item.name,
        amount: roundedAmount,
        price: actualPrice,
        unit: item.unit,
        category: item.category,
        recipes: Array.from(item.usedInRecipes)
      };
    }).sort((a, b) => a.category.localeCompare(b.category));

    const totalCost = groceryList.reduce((sum, item) => sum + item.price, 0);
    console.log(`\n✅ Generated ${groceryList.length} items, total: €${totalCost.toFixed(2)}`);
    
    return groceryList;
  }, [mealPlan, preferences.persons, preferences.eatingOutDays]);

  const getTotalCost = useCallback(() => {
    const total = generateGroceryList().reduce((total, item) => total + item.price, 0);
    console.log('Total weekly cost:', total.toFixed(2), 'Budget:', preferences.budgetPerWeek);
    return total;
  }, [generateGroceryList, preferences.budgetPerWeek]);



  const saveTasteProfile = useCallback(async (responses: TasteProfileResponse[]) => {
    console.log('💾 Saving taste profile with', responses.length, 'responses');
    
    const likedTags: { [tag: string]: number } = {};
    const dislikedTags: { [tag: string]: number } = {};
    const likedCuisines: { [cuisine: string]: number } = {};
    const dislikedCuisines: { [cuisine: string]: number } = {};
    const likedDiets: { [diet: string]: number } = {};
    const dislikedDiets: { [diet: string]: number } = {};
    
    responses.forEach(response => {
      if (response.response === 'like') {
        response.tags.forEach(tag => {
          likedTags[tag] = (likedTags[tag] || 0) + 1;
        });
        likedCuisines[response.cuisine] = (likedCuisines[response.cuisine] || 0) + 1;
        if (response.diet) {
          likedDiets[response.diet] = (likedDiets[response.diet] || 0) + 1;
        }
      } else if (response.response === 'dislike') {
        response.tags.forEach(tag => {
          dislikedTags[tag] = (dislikedTags[tag] || 0) + 1;
        });
        dislikedCuisines[response.cuisine] = (dislikedCuisines[response.cuisine] || 0) + 1;
        if (response.diet) {
          dislikedDiets[response.diet] = (dislikedDiets[response.diet] || 0) + 1;
        }
      }
    });
    
    const profile: TasteProfile = {
      responses,
      likedTags,
      dislikedTags,
      likedCuisines,
      dislikedCuisines,
      likedDiets,
      dislikedDiets,
      completedAt: new Date().toISOString()
    };
    
    setTasteProfile(profile);
    setIsTasteProfileComplete(true);
    
    await Promise.all([
      AsyncStorage.setItem('taste_profile', JSON.stringify(profile)),
      AsyncStorage.setItem('taste_profile_complete', JSON.stringify(true))
    ]);
    
    console.log('✅ Taste profile saved successfully');
    console.log('Liked tags:', Object.keys(likedTags).length);
    console.log('Liked cuisines:', Object.keys(likedCuisines).length);
  }, []);
  
  const resetTasteProfile = useCallback(async () => {
    setTasteProfile(null);
    setIsTasteProfileComplete(false);
    await Promise.all([
      AsyncStorage.removeItem('taste_profile'),
      AsyncStorage.removeItem('taste_profile_complete')
    ]);
    console.log('🔄 Taste profile reset');
  }, []);

  const resetApp = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('meal_preferences'),
        AsyncStorage.removeItem('meal_plan'),
        AsyncStorage.removeItem('onboarding_complete'),
        AsyncStorage.removeItem('removed_recipe_ids'),
        AsyncStorage.removeItem('taste_profile'),
        AsyncStorage.removeItem('taste_profile_complete')
      ]);
      
      setPreferences(defaultPreferences);
      setMealPlan([]);
      setIsOnboardingComplete(false);
      setRemovedRecipeIds(new Set());
      setTasteProfile(null);
      setIsTasteProfileComplete(false);
      
      console.log('App reset completed successfully');
    } catch (error) {
      console.error('Error resetting app:', error);
      throw error;
    }
  }, []);

  const removeRecipePermanently = useCallback(async (recipeId: string) => {
    try {
      const newRemovedIds = new Set(removedRecipeIds);
      newRemovedIds.add(recipeId);
      setRemovedRecipeIds(newRemovedIds);
      
      // Store updated removed recipe IDs
      await AsyncStorage.setItem('removed_recipe_ids', JSON.stringify(Array.from(newRemovedIds)));
      
      console.log('Recipe permanently removed:', recipeId);
      console.log('Total removed recipes:', newRemovedIds.size);
    } catch (error) {
      console.error('Error removing recipe permanently:', error);
    }
  }, [removedRecipeIds]);

  const getLeftovers = useCallback(() => {
    const groceryList = generateGroceryList();
    const leftovers: {
      name: string;
      amount: number;
      unit: string;
      category: string;
      leftoverAmount: number;
      leftoverPercentage: number;
    }[] = [];

    groceryList.forEach(item => {
      const usedAmount = item.amount;
      const packageSize = item.packageSize || usedAmount;
      const packagesNeeded = Math.ceil(usedAmount / packageSize);
      const totalBought = packagesNeeded * packageSize;
      const leftoverAmount = totalBought - usedAmount;
      
      if (leftoverAmount > 0.1) {
        const leftoverPercentage = (leftoverAmount / totalBought) * 100;
        leftovers.push({
          name: item.name,
          amount: usedAmount,
          unit: item.unit,
          category: item.category,
          leftoverAmount: Math.round(leftoverAmount * 10) / 10,
          leftoverPercentage: Math.round(leftoverPercentage)
        });
      }
    });

    leftovers.sort((a, b) => b.leftoverAmount - a.leftoverAmount);
    
    console.log('Detected leftovers:', leftovers);
    return leftovers;
  }, [generateGroceryList]);

  const swapMealsBetweenDays = useCallback((fromDayId: string, fromMealType: 'breakfast' | 'lunch' | 'dinner', toDayId: string, toMealType: 'breakfast' | 'lunch' | 'dinner') => {
    console.log('swapMealsBetweenDays called with:', { fromDayId, fromMealType, toDayId, toMealType });
    console.log('Current meal plan:', mealPlan.map(d => ({ id: d.id, date: d.date })));
    
    const fromDay = mealPlan.find(day => day.id === fromDayId || day.date === fromDayId);
    const toDay = mealPlan.find(day => day.id === toDayId || day.date === toDayId);
    
    if (!fromDay || !toDay) {
      console.error('Could not find days for swap', { fromDay: fromDay?.date, toDay: toDay?.date });
      return false;
    }
    
    const fromMeal = fromDay[fromMealType];
    const toMeal = toDay[toMealType];
    
    console.log('Meals to swap:', {
      fromMeal: fromMeal?.name,
      toMeal: toMeal?.name,
      fromDayDate: fromDay.date,
      toDayDate: toDay.date
    });
    
    if (!fromMeal || !toMeal) {
      console.error('Could not find meals for swap', {
        fromMeal: fromMeal?.name,
        toMeal: toMeal?.name
      });
      return false;
    }
    
    // Create deep copies of the meals to avoid reference issues
    const fromMealCopy = JSON.parse(JSON.stringify(fromMeal));
    const toMealCopy = JSON.parse(JSON.stringify(toMeal));
    
    // Handle swapping on the same day vs different days
    const isSameDay = fromDay.id === toDay.id;
    
    const updatedMealPlan = mealPlan.map(day => {
      if (day.id === fromDay.id) {
        if (isSameDay) {
          // Swapping meals on the same day - update both at once
          console.log(`Swapping ${fromMealType} and ${toMealType} on ${fromDay.date}`);
          return {
            ...day,
            [fromMealType]: toMealCopy,
            [toMealType]: fromMealCopy
          };
        } else {
          // Different days - update fromDay
          console.log(`Updating ${fromDay.date}'s ${fromMealType} from ${fromMeal.name} to ${toMealCopy.name}`);
          return { ...day, [fromMealType]: toMealCopy };
        }
      }
      if (day.id === toDay.id && !isSameDay) {
        // Different days - update toDay
        console.log(`Updating ${toDay.date}'s ${toMealType} from ${toMeal.name} to ${fromMealCopy.name}`);
        return { ...day, [toMealType]: fromMealCopy };
      }
      return day;
    });
    
    console.log('Updated meal plan:', updatedMealPlan.map(d => ({
      date: d.date,
      breakfast: d.breakfast?.name,
      lunch: d.lunch?.name,
      dinner: d.dinner?.name
    })));
    
    setMealPlan(updatedMealPlan);
    AsyncStorage.setItem('meal_plan', JSON.stringify(updatedMealPlan));
    
    console.log(`Successfully swapped ${fromDay.date}'s ${fromMealType} (${fromMeal.name}) with ${toDay.date}'s ${toMealType} (${toMeal.name})`);
    return true;
  }, [mealPlan]);

  const value = useMemo(() => ({
    preferences,
    mealPlan,
    isOnboardingComplete,
    tasteProfile,
    isTasteProfileComplete,
    isLoading,
    isInitialized,
    updatePreferences,
    completeOnboarding,
    saveTasteProfile,
    resetTasteProfile,
    generateMealPlan,
    swapMeal,
    generateGroceryList,
    getTotalCost,
    resetApp,
    removedRecipeIds,
    removeRecipePermanently,
    swapMealsBetweenDays,
    getLeftovers
  }), [
    preferences,
    mealPlan,
    isOnboardingComplete,
    tasteProfile,
    isTasteProfileComplete,
    isLoading,
    isInitialized,
    updatePreferences,
    completeOnboarding,
    saveTasteProfile,
    resetTasteProfile,
    generateMealPlan,
    swapMeal,
    generateGroceryList,
    getTotalCost,
    resetApp,
    removedRecipeIds,
    removeRecipePermanently,
    swapMealsBetweenDays,
    getLeftovers
  ]);

  return value;
});