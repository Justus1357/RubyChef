import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { trpc } from '@/lib/trpc';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  toolCallId?: string;
  name?: string;
};

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { mealPlan, preferences, generateGroceryList, getTotalCost, getLeftovers } = useMealPlanner();
  const insets = useSafeAreaInsets();
  
  const chatMutation = trpc.chat.openai.useMutation();

  const executeTool = useCallback((toolName: string, args: any) => {
    console.log('Executing tool:', toolName, 'with args:', args);
    
    switch (toolName) {
      case 'getCurrentTime': {
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
      
      case 'getMealPlan': {
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
      
      case 'getUserPreferences': {
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
      
      case 'getGroceryList': {
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
      
      case 'getLeftovers': {
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
      
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }, [mealPlan, preferences, generateGroceryList, getTotalCost, getLeftovers]);

  const tools = React.useMemo(() => [
    {
      type: 'function' as const,
      function: {
        name: 'getCurrentTime',
        description: 'Get the current date and time, including day of week',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getMealPlan',
        description: 'Get the complete meal plan for the week',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getUserPreferences',
        description: 'Get user dietary preferences and constraints',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getGroceryList',
        description: 'Get the grocery list with items and prices',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getLeftovers',
        description: 'Get list of leftover ingredients',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
  ], []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let currentMessages = [...messages, userMessage];
      let shouldContinue = true;
      let iterations = 0;
      const maxIterations = 5;

      while (shouldContinue && iterations < maxIterations) {
        iterations++;

        const response = await chatMutation.mutateAsync({
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content,
            ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
            ...(m.name ? { name: m.name } : {}),
          })) as any,
          tools,
        });

        const assistantMessage = response.message;

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          const assistantMsg: Message = {
            id: Date.now().toString() + '-assistant',
            role: 'assistant',
            content: assistantMessage.content || '',
            toolCalls: assistantMessage.tool_calls as any,
          };

          currentMessages = [...currentMessages, assistantMsg];

          for (const toolCall of assistantMessage.tool_calls) {
            try {
              const tc = toolCall as any;
              const args = JSON.parse(tc.function.arguments);
              const result = executeTool(tc.function.name, args);

              const toolMessage: Message = {
                id: Date.now().toString() + '-tool-' + toolCall.id,
                role: 'tool',
                content: result,
                toolCallId: toolCall.id,
                name: tc.function.name,
              };

              currentMessages = [...currentMessages, toolMessage];
            } catch (error) {
              console.error('Error executing tool:', error);
              const tc = toolCall as any;
              const errorMessage: Message = {
                id: Date.now().toString() + '-tool-error-' + toolCall.id,
                role: 'tool',
                content: JSON.stringify({ error: 'Failed to execute tool' }),
                toolCallId: toolCall.id,
                name: tc.function.name,
              };
              currentMessages = [...currentMessages, errorMessage];
            }
          }
        } else {
          const finalMessage: Message = {
            id: Date.now().toString() + '-final',
            role: 'assistant',
            content: assistantMessage.content || 'No response',
          };

          currentMessages = [...currentMessages, finalMessage];
          shouldContinue = false;
        }
      }

      setMessages(currentMessages);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, chatMutation, executeTool, tools]);

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
              </View>
            </View>
          )}

          {messages.filter(m => m.role === 'user' || (m.role === 'assistant' && m.content)).map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              <View
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
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#6D1F3C" />
              <Text style={styles.loadingText}>Thinking...</Text>
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
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} color={input.trim() && !isLoading ? '#fff' : '#ccc'} />
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
