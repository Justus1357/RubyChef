import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Send } from 'lucide-react-native';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import { createRorkTool, useRorkAgent } from '@rork/toolkit-sdk';
import { z } from 'zod';
import { recipes } from '@/data/recipes';
import { Recipe } from '@/types/meal';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { mealPlan, preferences, generateGroceryList, getTotalCost, getLeftovers, swapMeal, updatePreferences, generateMealPlan } = useMealPlanner();
  const insets = useSafeAreaInsets();

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {
      getCurrentTime: createRorkTool({
        description: 'Get the current date and time, including day of week',
        zodSchema: z.object({}),
        execute() {
          const now = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const currentDayOfWeek = days[now.getDay()];
          
          return `Current date and time information:
- Today is: ${currentDayOfWeek}
- Full date: ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}
- Time: ${now.toLocaleTimeString()}
- Time of day: ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}
- ISO timestamp: ${now.toISOString()}

IMPORTANT: Today is ${currentDayOfWeek}. When referring to the meal plan, the first day in the plan is always today (${currentDayOfWeek}).`;
        }
      }),
      getMealPlan: createRorkTool({
        description: 'Get the complete meal plan for the week',
        zodSchema: z.object({}),
        execute() {
          const detailedPlan = mealPlan.map(day => ({
            date: day.date,
            breakfast: day.breakfast ? {
              name: day.breakfast.name,
              description: day.breakfast.description,
              cookTime: day.breakfast.cookTime,
              calories: day.breakfast.nutrition.calories,
              protein: day.breakfast.nutrition.protein,
              difficulty: day.breakfast.difficulty,
              cuisine: day.breakfast.cuisine
            } : null,
            lunch: day.lunch ? {
              name: day.lunch.name,
              description: day.lunch.description,
              cookTime: day.lunch.cookTime,
              calories: day.lunch.nutrition.calories,
              protein: day.lunch.nutrition.protein,
              difficulty: day.lunch.difficulty,
              cuisine: day.lunch.cuisine
            } : null,
            dinner: day.dinner ? {
              name: day.dinner.name,
              description: day.dinner.description,
              cookTime: day.dinner.cookTime,
              calories: day.dinner.nutrition.calories,
              protein: day.dinner.nutrition.protein,
              difficulty: day.dinner.difficulty,
              cuisine: day.dinner.cuisine
            } : null
          }));
          
          return JSON.stringify({
            mealPlan: detailedPlan,
            totalCost: getTotalCost(),
            weeklyBudget: preferences.budgetPerWeek,
            overBudget: getTotalCost() > preferences.budgetPerWeek,
            budgetDifference: (getTotalCost() - preferences.budgetPerWeek).toFixed(2)
          });
        }
      }),
      getUserPreferences: createRorkTool({
        description: 'Get user dietary preferences and constraints',
        zodSchema: z.object({}),
        execute() {
          return JSON.stringify({
            diet: preferences.diet,
            mealMix: preferences.mealMix,
            persons: preferences.persons,
            budgetPerWeek: preferences.budgetPerWeek,
            maxTimePerMeal: preferences.maxTimePerMeal,
            allergies: preferences.allergies,
            dislikes: preferences.dislikes,
            goals: preferences.goals,
            notes: preferences.notes
          });
        }
      }),
      getGroceryList: createRorkTool({
        description: 'Get the grocery list with items and prices',
        zodSchema: z.object({}),
        execute() {
          const groceryList = generateGroceryList();
          const totalCost = getTotalCost();
          
          return JSON.stringify({
            items: groceryList.map(item => ({
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              price: item.price,
              category: item.category,
              usedInRecipes: item.recipes
            })),
            totalCost: totalCost,
            totalItems: groceryList.length,
            budgetTarget: preferences.budgetPerWeek,
            withinBudget: totalCost <= preferences.budgetPerWeek,
            overBudgetAmount: totalCost > preferences.budgetPerWeek ? (totalCost - preferences.budgetPerWeek).toFixed(2) : 0,
            categorySummary: groceryList.reduce((acc, item) => {
              acc[item.category] = (acc[item.category] || 0) + item.price;
              return acc;
            }, {} as Record<string, number>)
          });
        }
      }),
      getLeftovers: createRorkTool({
        description: 'Get list of leftover ingredients',
        zodSchema: z.object({}),
        execute() {
          const leftovers = getLeftovers();
          
          if (leftovers.length === 0) {
            return JSON.stringify({
              hasLeftovers: false,
              message: "Great news! Your meal plan is optimized with minimal leftovers."
            });
          }
          
          return JSON.stringify({
            hasLeftovers: true,
            totalItems: leftovers.length,
            leftovers: leftovers.map(item => ({
              name: item.name,
              leftoverAmount: item.leftoverAmount,
              unit: item.unit,
              category: item.category,
              leftoverPercentage: item.leftoverPercentage,
              description: `${item.leftoverAmount}${item.unit} of ${item.name} (${item.leftoverPercentage}% of package)`
            })),
            topLeftovers: leftovers.slice(0, 5).map(item => `${item.name}: ${item.leftoverAmount}${item.unit}`)
          });
        }
      }),
      swapMeal: createRorkTool({
        description: 'Swap a specific meal in the meal plan with a different recipe. Use this when the user says they don\'t like a specific meal or wants to change it.',
        zodSchema: z.object({
          dayDate: z.string().describe('The day of the week (e.g., "Monday", "Tuesday"). This should be the date field from the meal plan.'),
          mealType: z.enum(['breakfast', 'lunch', 'dinner']).describe('Which meal to swap: breakfast, lunch, or dinner')
        }),
        execute(input) {
          const day = mealPlan.find(d => d.date === input.dayDate);
          if (!day) {
            return JSON.stringify({
              success: false,
              message: `Could not find day "${input.dayDate}" in the meal plan. Available days: ${mealPlan.map(d => d.date).join(', ')}`
            });
          }
          
          const currentMeal = day[input.mealType];
          if (!currentMeal) {
            return JSON.stringify({
              success: false,
              message: `No ${input.mealType} found for ${input.dayDate}`
            });
          }
          
          const oldMealName = currentMeal.name;
          swapMeal(day.id, input.mealType);
          
          // Get the new meal after swap
          const updatedDay = mealPlan.find(d => d.date === input.dayDate);
          const newMeal = updatedDay?.[input.mealType];
          
          return JSON.stringify({
            success: true,
            message: `Swapped ${input.mealType} on ${input.dayDate} from "${oldMealName}" to "${newMeal?.name}"`,
            oldMeal: oldMealName,
            newMeal: newMeal?.name
          });
        }
      }),
      addToDislikedIngredients: createRorkTool({
        description: 'Add ingredients or foods that the user dislikes to their preferences. This will prevent these items from appearing in future meal plans. Use this when the user says they don\'t like a specific ingredient, food, or dish.',
        zodSchema: z.object({
          ingredients: z.array(z.string()).describe('Array of ingredient names or foods to add to the dislike list (e.g., ["olives", "mushrooms", "anchovies"])')
        }),
        execute(input) {
          const newDislikes = [...new Set([...preferences.dislikes, ...input.ingredients])];
          const addedItems = input.ingredients.filter(item => !preferences.dislikes.includes(item));
          
          updatePreferences({
            ...preferences,
            dislikes: newDislikes
          });
          
          return JSON.stringify({
            success: true,
            message: `Added ${addedItems.join(', ')} to your disliked ingredients. These won't appear in future meal plans.`,
            addedItems: addedItems,
            totalDislikes: newDislikes.length,
            allDislikes: newDislikes
          });
        }
      }),
      removeFromDislikedIngredients: createRorkTool({
        description: 'Remove ingredients from the user\'s dislike list. Use this when the user says they now like something they previously disliked.',
        zodSchema: z.object({
          ingredients: z.array(z.string()).describe('Array of ingredient names to remove from the dislike list')
        }),
        execute(input) {
          const newDislikes = preferences.dislikes.filter(
            dislike => !input.ingredients.some(item => dislike.toLowerCase().includes(item.toLowerCase()))
          );
          const removedItems = preferences.dislikes.filter(dislike => !newDislikes.includes(dislike));
          
          updatePreferences({
            ...preferences,
            dislikes: newDislikes
          });
          
          return JSON.stringify({
            success: true,
            message: `Removed ${removedItems.join(', ')} from your disliked ingredients.`,
            removedItems: removedItems,
            totalDislikes: newDislikes.length,
            allDislikes: newDislikes
          });
        }
      }),
      regenerateMealPlan: createRorkTool({
        description: 'Regenerate the entire meal plan. Use this after changing preferences like dislikes, or when the user wants a completely new meal plan.',
        zodSchema: z.object({}),
        execute() {
          generateMealPlan();
          
          return JSON.stringify({
            success: true,
            message: 'Generated a new meal plan based on your preferences. The plan has been updated to avoid your disliked ingredients.'
          });
        }
      }),
      getRecipeDetails: createRorkTool({
        description: 'Get detailed information about a specific recipe including full ingredients list, instructions, nutrition facts, and cooking details. Use this when the user asks about a specific meal or wants to know more details.',
        zodSchema: z.object({
          recipeName: z.string().describe('The name of the recipe to get details for')
        }),
        execute(input) {
          const recipe = mealPlan.flatMap(day => [day.breakfast, day.lunch, day.dinner])
            .filter(Boolean)
            .find(r => r?.name.toLowerCase().includes(input.recipeName.toLowerCase()));
          
          if (!recipe) {
            return JSON.stringify({
              success: false,
              message: `Recipe "${input.recipeName}" not found in the current meal plan.`
            });
          }
          
          return JSON.stringify({
            success: true,
            recipe: {
              name: recipe.name,
              description: recipe.description,
              image: recipe.image,
              cookTime: recipe.cookTime,
              servings: recipe.servings,
              difficulty: recipe.difficulty,
              cuisine: recipe.cuisine,
              mealType: recipe.mealType,
              ingredients: recipe.ingredients.map(ing => ({
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                price: ing.price,
                category: ing.category
              })),
              instructions: recipe.instructions,
              nutrition: {
                calories: recipe.nutrition.calories,
                protein: recipe.nutrition.protein,
                carbs: recipe.nutrition.carbs,
                fat: recipe.nutrition.fat
              },
              tags: recipe.tags,
              totalCost: recipe.ingredients.reduce((sum, ing) => sum + ing.price, 0)
            }
          });
        }
      }),
      searchRecipes: createRorkTool({
        description: 'Search for recipes in the database by criteria like name, cuisine, meal type, dietary preferences, cooking time, or ingredients. Useful when user asks about available recipes or wants alternatives.',
        zodSchema: z.object({
          query: z.string().optional().describe('Search query for recipe name or description'),
          cuisine: z.string().optional().describe('Filter by cuisine (e.g., Italian, Mexican, Asian)'),
          mealType: z.enum(['breakfast', 'lunch', 'dinner']).optional().describe('Filter by meal type'),
          maxCookTime: z.number().optional().describe('Maximum cooking time in minutes'),
          maxCalories: z.number().optional().describe('Maximum calories per serving'),
          tags: z.array(z.string()).optional().describe('Tags to filter by (e.g., vegan, vegetarian, high-protein, quick)'),
          limit: z.number().optional().describe('Maximum number of results to return (default: 10)')
        }),
        execute(input) {
          let filteredRecipes = [...recipes];
          
          if (input.query) {
            const query = input.query.toLowerCase();
            filteredRecipes = filteredRecipes.filter(r => 
              r.name.toLowerCase().includes(query) || 
              r.description.toLowerCase().includes(query) ||
              r.ingredients.some(ing => ing.name.toLowerCase().includes(query))
            );
          }
          
          if (input.cuisine) {
            filteredRecipes = filteredRecipes.filter(r => 
              r.cuisine.toLowerCase().includes(input.cuisine!.toLowerCase())
            );
          }
          
          if (input.mealType) {
            filteredRecipes = filteredRecipes.filter(r => r.mealType === input.mealType);
          }
          
          if (input.maxCookTime) {
            filteredRecipes = filteredRecipes.filter(r => r.cookTime <= input.maxCookTime!);
          }
          
          if (input.maxCalories) {
            filteredRecipes = filteredRecipes.filter(r => r.nutrition.calories <= input.maxCalories!);
          }
          
          if (input.tags && input.tags.length > 0) {
            filteredRecipes = filteredRecipes.filter(r => 
              input.tags!.some(tag => r.tags.includes(tag.toLowerCase()))
            );
          }
          
          const limit = input.limit || 10;
          const results = filteredRecipes.slice(0, limit);
          
          return JSON.stringify({
            success: true,
            totalFound: filteredRecipes.length,
            showing: results.length,
            recipes: results.map(r => ({
              name: r.name,
              description: r.description,
              cuisine: r.cuisine,
              mealType: r.mealType,
              cookTime: r.cookTime,
              difficulty: r.difficulty,
              calories: r.nutrition.calories,
              protein: r.nutrition.protein,
              tags: r.tags,
              cost: r.ingredients.reduce((sum, ing) => sum + ing.price, 0).toFixed(2)
            }))
          });
        }
      }),
      getIngredientInfo: createRorkTool({
        description: 'Get information about a specific ingredient including which recipes use it, typical amounts, price, and nutritional role.',
        zodSchema: z.object({
          ingredientName: z.string().describe('Name of the ingredient to get information about')
        }),
        execute(input) {
          const groceryList = generateGroceryList();
          const ingredient = groceryList.find(item => 
            item.name.toLowerCase().includes(input.ingredientName.toLowerCase())
          );
          
          if (!ingredient) {
            return JSON.stringify({
              success: false,
              message: `Ingredient "${input.ingredientName}" not found in your current grocery list. It may not be part of your meal plan this week.`
            });
          }
          
          const allRecipes = mealPlan.flatMap(day => 
            [day.breakfast, day.lunch, day.dinner].filter(Boolean)
          ) as Recipe[];
          
          const recipesUsingIngredient = allRecipes.filter(recipe => 
            recipe.ingredients.some(ing => 
              ing.name.toLowerCase() === ingredient.name.toLowerCase()
            )
          );
          
          const ingredientDetails = recipesUsingIngredient
            .flatMap(recipe => recipe.ingredients)
            .filter(ing => ing.name.toLowerCase() === ingredient.name.toLowerCase());
          
          const avgAmount = ingredientDetails.length > 0
            ? ingredientDetails.reduce((sum, ing) => sum + ing.amount, 0) / ingredientDetails.length
            : ingredient.amount;
          
          return JSON.stringify({
            success: true,
            ingredient: {
              name: ingredient.name,
              category: ingredient.category,
              totalAmount: ingredient.amount,
              unit: ingredient.unit,
              price: ingredient.price,
              averageAmountPerRecipe: Math.round(avgAmount * 10) / 10,
              usedInRecipes: ingredient.recipes,
              numberOfRecipes: ingredient.recipes.length,
              details: ingredientDetails.map(ing => ({
                amount: ing.amount,
                unit: ing.unit,
                packageSize: ing.packageSize,
                pricePerPackage: ing.pricePerPackage
              }))
            }
          });
        }
      }),
      getNutritionSummary: createRorkTool({
        description: 'Get a nutrition summary for the meal plan including daily and weekly totals for calories, protein, carbs, and fat.',
        zodSchema: z.object({
          dayDate: z.string().optional().describe('Specific day to get nutrition for (e.g., "Monday"). If not provided, returns weekly summary.')
        }),
        execute(input) {
          if (input.dayDate) {
            const day = mealPlan.find(d => d.date === input.dayDate);
            if (!day) {
              return JSON.stringify({
                success: false,
                message: `Day "${input.dayDate}" not found in meal plan.`
              });
            }
            
            const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean) as Recipe[];
            const totals = meals.reduce((acc, meal) => ({
              calories: acc.calories + meal.nutrition.calories,
              protein: acc.protein + meal.nutrition.protein,
              carbs: acc.carbs + meal.nutrition.carbs,
              fat: acc.fat + meal.nutrition.fat
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            
            return JSON.stringify({
              success: true,
              day: input.dayDate,
              meals: meals.map(m => ({
                name: m.name,
                mealType: m.mealType,
                nutrition: m.nutrition
              })),
              dailyTotals: totals
            });
          }
          
          const weeklyTotals = mealPlan.reduce((acc, day) => {
            const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean) as Recipe[];
            meals.forEach(meal => {
              acc.calories += meal.nutrition.calories;
              acc.protein += meal.nutrition.protein;
              acc.carbs += meal.nutrition.carbs;
              acc.fat += meal.nutrition.fat;
            });
            return acc;
          }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          const avgDaily = {
            calories: Math.round(weeklyTotals.calories / 7),
            protein: Math.round(weeklyTotals.protein / 7),
            carbs: Math.round(weeklyTotals.carbs / 7),
            fat: Math.round(weeklyTotals.fat / 7)
          };
          
          return JSON.stringify({
            success: true,
            weeklyTotals,
            averageDaily: avgDaily,
            daysInPlan: mealPlan.length
          });
        }
      })
    }
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const userInput = input.trim();
    setInput('');
    setIsSending(true);
    
    try {
      await sendMessage(userInput);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <MessageCircle size={24} color="#6D1F3C" />
        <Text style={styles.title}>AI Assistant</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Ask me anything!</Text>
              <Text style={styles.emptyText}>
                I can help you with your meal plan, recipes, grocery list, leftovers, cooking tips, and answer any questions you have!
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("What's on my meal plan this week?")}
                >
                  <Text style={styles.suggestionText}>What&apos;s on my meal plan?</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("Show me my grocery list")}
                >
                  <Text style={styles.suggestionText}>Show me my grocery list</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("What are my dietary preferences?")}
                >
                  <Text style={styles.suggestionText}>What are my preferences?</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("What leftovers do I have?")}
                >
                  <Text style={styles.suggestionText}>Check my leftovers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("Tell me about today's dinner recipe")}
                >
                  <Text style={styles.suggestionText}>Tell me about a recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("What's the nutrition for today?")}
                >
                  <Text style={styles.suggestionText}>Show nutrition summary</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {messages.map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <View
                      key={`${message.id}-${i}`}
                      style={[
                        styles.messageBubble,
                        message.role === 'user' ? styles.userBubble : styles.assistantBubble
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userText : styles.assistantText
                        ]}
                      >
                        {part.text}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          ))}

          {isSending && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#6D1F3C" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorBubble}>
              <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isSending}
          >
            <Send size={20} color={input.trim() && !isSending ? '#fff' : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6D1F3C',
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 14,
    color: '#6D1F3C',
    fontWeight: '500' as const,
  },
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6D1F3C',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6D1F3C',
    fontStyle: 'italic' as const,
  },
  errorBubble: {
    backgroundColor: '#fee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6D1F3C',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
});
