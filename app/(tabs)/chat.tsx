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
import { useRorkAgent, createRorkTool } from '@rork/toolkit-sdk';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import { z } from 'zod';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { mealPlan, preferences, generateGroceryList, getTotalCost, swapMeal, swapMealsBetweenDays, getLeftovers } = useMealPlanner();
  const insets = useSafeAreaInsets();

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {
      getCurrentTime: createRorkTool({
        description: "Get the current date and time, including day of week, hour, minute, and timezone. Use this to provide time-aware recipe suggestions and understand what meal the user might be planning. IMPORTANT: Always use the dayOfWeek field to determine what day it is today.",
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
        description: "Get the complete meal plan for the week with all meals, including recipe names, descriptions, cook times, and nutrition info",
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
        description: "Get user's complete dietary preferences, budget, cooking constraints, allergies, dislikes, and goals",
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
        description: "Get the complete grocery list with all items, quantities, prices, categories, and which recipes use each ingredient",
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
              usedInRecipes: item.recipes,
              packagesNeeded: item.packagesNeeded,
              packageSize: item.packageSize
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
      getRecipeDetails: createRorkTool({
        description: "Get complete details about a specific recipe including ingredients, instructions, nutrition, cook time, and difficulty",
        zodSchema: z.object({
          recipeName: z.string().describe("The name of the recipe to get details for")
        }),
        execute(input) {
          const allRecipes = mealPlan.flatMap(day => [
            day.breakfast,
            day.lunch,
            day.dinner
          ].filter(Boolean));
          
          const recipe = allRecipes.find(r => 
            r?.name.toLowerCase().includes(input.recipeName.toLowerCase())
          );
          
          if (!recipe) {
            return JSON.stringify({ error: "Recipe not found in current meal plan" });
          }
          
          return JSON.stringify({
            name: recipe.name,
            description: recipe.description,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            cuisine: recipe.cuisine,
            ingredients: recipe.ingredients.map(ing => ({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              price: ing.price,
              category: ing.category
            })),
            instructions: recipe.instructions,
            nutrition: recipe.nutrition,
            tags: recipe.tags,
            totalCost: recipe.ingredients.reduce((sum, ing) => sum + ing.price, 0).toFixed(2),
            costPerServing: (recipe.ingredients.reduce((sum, ing) => sum + ing.price, 0) / recipe.servings).toFixed(2)
          });
        }
      }),
      getNutritionSummary: createRorkTool({
        description: "Get nutritional summary for the entire week or a specific day",
        zodSchema: z.object({
          day: z.string().optional().describe("Specific day to get nutrition for (e.g., 'Monday'), or leave empty for weekly summary")
        }),
        execute(input) {
          const daysToAnalyze = input.day 
            ? mealPlan.filter(d => d.date.toLowerCase() === input.day!.toLowerCase())
            : mealPlan;
          
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          
          daysToAnalyze.forEach(day => {
            [day.breakfast, day.lunch, day.dinner].forEach(meal => {
              if (meal) {
                totalCalories += meal.nutrition.calories;
                totalProtein += meal.nutrition.protein;
                totalCarbs += meal.nutrition.carbs;
                totalFat += meal.nutrition.fat;
              }
            });
          });
          
          return JSON.stringify({
            period: input.day || 'Weekly',
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            averageCaloriesPerDay: input.day ? totalCalories : Math.round(totalCalories / mealPlan.length),
            proteinPercentage: Math.round((totalProtein * 4 / totalCalories) * 100),
            carbsPercentage: Math.round((totalCarbs * 4 / totalCalories) * 100),
            fatPercentage: Math.round((totalFat * 9 / totalCalories) * 100)
          });
        }
      }),
      getCostBreakdown: createRorkTool({
        description: "Get detailed cost breakdown by category, day, or meal type",
        zodSchema: z.object({}),
        execute() {
          const groceryList = generateGroceryList();
          const totalCost = getTotalCost();
          
          const byCategory = groceryList.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.price;
            return acc;
          }, {} as Record<string, number>);
          
          const byDay = mealPlan.map(day => {
            const dayCost = [day.breakfast, day.lunch, day.dinner]
              .filter(Boolean)
              .reduce((sum, meal) => {
                return sum + meal!.ingredients.reduce((s, ing) => s + (ing.price * preferences.persons / meal!.servings), 0);
              }, 0);
            
            return {
              day: day.date,
              cost: dayCost.toFixed(2)
            };
          });
          
          return JSON.stringify({
            totalCost: totalCost.toFixed(2),
            budget: preferences.budgetPerWeek,
            remaining: (preferences.budgetPerWeek - totalCost).toFixed(2),
            overBudget: totalCost > preferences.budgetPerWeek,
            byCategory,
            byDay,
            averageCostPerDay: (totalCost / mealPlan.length).toFixed(2),
            costPerPerson: (totalCost / preferences.persons).toFixed(2)
          });
        }
      }),
      swapMealsBetweenDays: createRorkTool({
        description: "Swap meals between two different days. For example, swap Monday's dinner with Wednesday's lunch, or swap today's breakfast with tomorrow's breakfast. Use this when the user wants to exchange meals between different days.",
        zodSchema: z.object({
          fromDay: z.string().describe("The day to swap from (e.g., 'Monday', 'Tuesday', 'today', 'tomorrow')"),
          fromMealType: z.enum(['breakfast', 'lunch', 'dinner']).describe("The meal type to swap from (breakfast, lunch, or dinner)"),
          toDay: z.string().describe("The day to swap to (e.g., 'Monday', 'Tuesday', 'today', 'tomorrow')"),
          toMealType: z.enum(['breakfast', 'lunch', 'dinner']).describe("The meal type to swap to (breakfast, lunch, or dinner)")
        }),
        execute(input) {
          const now = new Date();
          const currentDayIndex = now.getDay();
          const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayName = allDays[currentDayIndex];
          
          const resolveDayName = (dayInput: string): string => {
            const lowerInput = dayInput.toLowerCase();
            if (lowerInput === 'today') return currentDayName;
            if (lowerInput === 'tomorrow') {
              const tomorrowIndex = (currentDayIndex + 1) % 7;
              return allDays[tomorrowIndex];
            }
            const capitalized = dayInput.charAt(0).toUpperCase() + dayInput.slice(1).toLowerCase();
            return allDays.find(d => d === capitalized) || dayInput;
          };
          
          const fromDayName = resolveDayName(input.fromDay);
          const toDayName = resolveDayName(input.toDay);
          
          const fromDayPlan = mealPlan.find(day => day.date === fromDayName);
          const toDayPlan = mealPlan.find(day => day.date === toDayName);
          
          if (!fromDayPlan || !toDayPlan) {
            return JSON.stringify({
              success: false,
              error: `Could not find meal plan for ${!fromDayPlan ? fromDayName : toDayName}`
            });
          }
          
          const fromMeal = fromDayPlan[input.fromMealType];
          const toMeal = toDayPlan[input.toMealType];
          
          if (!fromMeal || !toMeal) {
            return JSON.stringify({
              success: false,
              error: `Could not find ${!fromMeal ? input.fromMealType + ' on ' + fromDayName : input.toMealType + ' on ' + toDayName}`
            });
          }
          
          const success = swapMealsBetweenDays(fromDayName, input.fromMealType, toDayName, input.toMealType);
          
          if (!success) {
            return JSON.stringify({
              success: false,
              error: 'Failed to swap meals'
            });
          }
          
          return JSON.stringify({
            success: true,
            message: `Successfully swapped ${fromDayName}'s ${input.fromMealType} (${fromMeal.name}) with ${toDayName}'s ${input.toMealType} (${toMeal.name})`,
            fromMeal: {
              day: fromDayName,
              mealType: input.fromMealType,
              recipe: fromMeal.name,
              nowHas: toMeal.name
            },
            toMeal: {
              day: toDayName,
              mealType: input.toMealType,
              recipe: toMeal.name,
              nowHas: fromMeal.name
            }
          });
        }
      }),
      getLeftovers: createRorkTool({
        description: "Get a detailed list of leftover ingredients from the current meal plan. Shows ingredients that will be left over after cooking all planned meals because they come in larger packages than needed. This is critical for suggesting recipes using leftovers.",
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
            topLeftovers: leftovers.slice(0, 5).map(item => `${item.name}: ${item.leftoverAmount}${item.unit}`),
            suggestion: "You can ask me to suggest a recipe using these leftover ingredients! Just say 'make a meal from leftovers' or 'suggest a recipe using leftovers'.",
            instructionsForAI: "IMPORTANT: When the user asks to make a meal from leftovers, you should: 1) Review the leftover ingredients above, 2) Suggest a creative recipe that uses as many of these leftovers as possible, 3) Include the recipe name, ingredients (highlighting which are from leftovers), cooking instructions, and estimated cooking time. Be creative and practical!"
          });
        }
      }),
      replaceMealWithAlternative: createRorkTool({
        description: "Replace a specific meal with a different recipe from the available options. Use this when the user wants to change a meal to something else but doesn't want to swap with another day.",
        zodSchema: z.object({
          day: z.string().describe("The day of the meal to replace (e.g., 'Monday', 'Tuesday', 'today', 'tomorrow')"),
          mealType: z.enum(['breakfast', 'lunch', 'dinner']).describe("The meal type to replace (breakfast, lunch, or dinner)")
        }),
        execute(input) {
          const now = new Date();
          const currentDayIndex = now.getDay();
          const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayName = allDays[currentDayIndex];
          
          const resolveDayName = (dayInput: string): string => {
            const lowerInput = dayInput.toLowerCase();
            if (lowerInput === 'today') return currentDayName;
            if (lowerInput === 'tomorrow') {
              const tomorrowIndex = (currentDayIndex + 1) % 7;
              return allDays[tomorrowIndex];
            }
            const capitalized = dayInput.charAt(0).toUpperCase() + dayInput.slice(1).toLowerCase();
            return allDays.find(d => d === capitalized) || dayInput;
          };
          
          const dayName = resolveDayName(input.day);
          const dayPlan = mealPlan.find(day => day.date === dayName);
          
          if (!dayPlan) {
            return JSON.stringify({
              success: false,
              error: `Could not find meal plan for ${dayName}`
            });
          }
          
          const currentMeal = dayPlan[input.mealType];
          if (!currentMeal) {
            return JSON.stringify({
              success: false,
              error: `No ${input.mealType} found for ${dayName}`
            });
          }
          
          swapMeal(dayPlan.id, input.mealType);
          
          const updatedDayPlan = mealPlan.find(day => day.date === dayName);
          const newMeal = updatedDayPlan?.[input.mealType];
          
          return JSON.stringify({
            success: true,
            message: `Successfully replaced ${dayName}'s ${input.mealType}`,
            previousMeal: currentMeal.name,
            newMeal: newMeal?.name || 'Unknown',
            day: dayName,
            mealType: input.mealType
          });
        }
      })
    }
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
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
                  onPress={() => setInput("What's a good recipe for dinner tonight?")}
                >
                  <Text style={styles.suggestionText}>Recipe suggestions</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("What leftovers do I have?")}
                >
                  <Text style={styles.suggestionText}>Check my leftovers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setInput("Make a meal from my leftovers")}
                >
                  <Text style={styles.suggestionText}>Recipe from leftovers</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {messages.map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  return (
                    <View
                      key={`${message.id}-${index}`}
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
                
                if (part.type === 'tool') {
                  if (part.state === 'input-streaming' || part.state === 'input-available') {
                    return (
                      <View key={`${message.id}-${index}`} style={styles.toolBubble}>
                        <ActivityIndicator size="small" color="#6D1F3C" />
                        <Text style={styles.toolText}>Using {part.toolName}...</Text>
                      </View>
                    );
                  }
                  
                  if (part.state === 'output-error') {
                    return (
                      <View key={`${message.id}-${index}`} style={styles.errorBubble}>
                        <Text style={styles.errorText}>Error: {part.errorText}</Text>
                      </View>
                    );
                  }
                }
                
                return null;
              })}
            </View>
          ))}

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
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color={input.trim() ? '#fff' : '#ccc'} />
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    fontWeight: '500',
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
  toolBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
    marginBottom: 4,
  },
  toolText: {
    fontSize: 14,
    color: '#6D1F3C',
    fontStyle: 'italic',
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
    fontStyle: 'italic',
  },
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fcc',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#c33',
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
