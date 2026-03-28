import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Copy, Download, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateText } from '@rork/toolkit-sdk';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import { getIngredientPrice } from '@/data/ingredient-prices';

interface PackageInfo {
  name: string;
  category: string;
  needed: number;
  unit: string;
  packageSize: number;
  packagesNeeded: number;
  totalBought: number;
  leftover: number;
  price: number;
  recipes: string[];
}

export default function GroceryScreen() {
  const { generateGroceryList, getTotalCost, mealPlan, preferences } = useMealPlanner();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedLeftoverCategories, setExpandedLeftoverCategories] = useState<Set<string>>(new Set());

  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  
  const groceryList = generateGroceryList();
  const totalCost = getTotalCost();
  
  const packagedGroceryList = useMemo((): PackageInfo[] => {
    return groceryList.map(item => {
      const priceInfo = getIngredientPrice(item.name, item.amount);
      const packagesNeeded = Math.ceil(item.amount / priceInfo.packageSize);
      const totalBought = packagesNeeded * priceInfo.packageSize;
      const leftover = totalBought - item.amount;
      
      return {
        name: item.name,
        category: item.category,
        needed: item.amount,
        unit: item.unit,
        packageSize: priceInfo.packageSize,
        packagesNeeded,
        totalBought,
        leftover,
        price: item.price,
        recipes: item.recipes || []
      };
    });
  }, [groceryList]);
  
  useEffect(() => {
    console.log('Grocery list updated, items:', groceryList.length);
  }, [groceryList.length, mealPlan]);
  
  const groupedItems = packagedGroceryList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof packagedGroceryList>);
  
  const leftoverItems = packagedGroceryList.filter(item => item.leftover > 0.1);
  const groupedLeftovers = leftoverItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof leftoverItems>);
  
  const totalLeftoverValue = leftoverItems.reduce((sum, item) => {
    const leftoverPercentage = item.leftover / item.totalBought;
    return sum + (item.price * leftoverPercentage);
  }, 0);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  const toggleLeftoverCategory = (category: string) => {
    const newExpanded = new Set(expandedLeftoverCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedLeftoverCategories(newExpanded);
  };

  const scanReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to scan receipts');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsScanning(true);
        
        try {
          const base64Image = result.assets[0].base64;
          
          const prompt = `Analyze this receipt image and extract all food items purchased. Return ONLY a JSON array of item names, nothing else. Format: ["item1", "item2", "item3"]. Focus on food items only, ignore non-food items, prices, and store information.`;
          
          const response = await generateText({
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image', image: `data:image/jpeg;base64,${base64Image}` }
                ]
              }
            ]
          });
          
          const jsonMatch = response.match(/\[.*\]/s);
          if (jsonMatch) {
            const items = JSON.parse(jsonMatch[0]);
            setScannedItems(items);
            Alert.alert(
              'Receipt Scanned!',
              `Found ${items.length} items:\n${items.slice(0, 5).join(', ')}${items.length > 5 ? '...' : ''}`,
              [
                { text: 'OK' }
              ]
            );
          } else {
            throw new Error('Could not parse items from receipt');
          }
        } catch (error) {
          console.error('Error scanning receipt:', error);
          Alert.alert('Scan Error', 'Could not read the receipt. Please try again with a clearer image.');
        } finally {
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker');
      setIsScanning(false);
    }
  };

  const shareGroceryList = async () => {
    const listText = Object.entries(groupedItems)
      .map(([category, items]) => {
        const categoryItems = items
          .map(item => `• Buy ${item.packagesNeeded}x ${item.packageSize}${item.unit} ${item.name} (need ${Math.round(item.needed)}${item.unit}) - €${item.price.toFixed(2)}`)
          .join('\n');
        return `${category}:\n${categoryItems}`;
      })
      .join('\n\n');
    
    const leftoverText = leftoverItems.length > 0 ? Object.entries(groupedLeftovers)
      .map(([category, items]) => {
        const categoryItems = items
          .map(item => `• ${item.name}: ${Math.round(item.leftover)}${item.unit} leftover`)
          .join('\n');
        return `${category}:\n${categoryItems}`;
      })
      .join('\n\n') : '';
    
    const fullText = `Grocery List\n\n${listText}\n\nTotal: €${totalCost.toFixed(2)}${leftoverText ? `\n\nLeftovers (€${totalLeftoverValue.toFixed(2)} value):\n\n${leftoverText}` : ''}`;
    
    try {
      await Share.share({
        message: fullText,
        title: 'Grocery List'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (groceryList.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <ShoppingCart size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Grocery List Yet</Text>
        <Text style={styles.emptyText}>
          Generate a meal plan first to see your grocery list
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Groceries</Text>
          <Text style={styles.subtitle}>
            Exact amounts needed for your weekly meal plan
          </Text>
          {scannedItems.length > 0 && (
            <Text style={styles.scannedInfo}>
              ✓ {scannedItems.length} items from receipt
            </Text>
          )}
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={scanReceipt}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#6D1F3C" />
            ) : (
              <Upload size={18} color="#6D1F3C" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={shareGroceryList}>
            <Copy size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total: €{totalCost.toFixed(2)}</Text>
        <Text style={styles.totalSubtext}>
          Shopping for {preferences.persons} {preferences.persons === 1 ? 'person' : 'people'} {'•'} Package sizes included
        </Text>
        {totalLeftoverValue > 0.5 && (
          <Text style={styles.leftoverHint}>
            ~€{totalLeftoverValue.toFixed(2)} in leftovers (see below)
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Shopping List</Text>
        {Object.entries(groupedItems).map(([category, items]) => {
          const isExpanded = expandedCategories.has(category);
          const categoryTotal = items.reduce((sum, item) => sum + item.price, 0);
          
          return (
            <View key={category} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.categoryTotal}>€{categoryTotal.toFixed(2)}</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.itemsContainer}>
                  {items.map((item, idx) => {
                    const isScanned = scannedItems.some(scanned => 
                      item.name.toLowerCase().includes(scanned.toLowerCase()) ||
                      scanned.toLowerCase().includes(item.name.toLowerCase())
                    );
                    
                    return (
                      <View key={`${item.name}-${idx}`} style={[styles.itemRow, isScanned && styles.itemRowScanned]}>
                        <View style={styles.itemInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.itemName, isScanned && styles.itemNameScanned]}>
                              {item.name}
                            </Text>
                            {isScanned && (
                              <View style={styles.scannedBadge}>
                                <Text style={styles.scannedBadgeText}>✓ Have</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemAmount}>
                            Need: {Math.round(item.needed)}{item.unit}
                          </Text>
                          {item.recipes && item.recipes.length > 0 && (
                            <Text style={styles.itemRecipes}>
                              Used in: {item.recipes.join(', ')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.priceInfo}>
                          <Text style={[styles.itemPrice, isScanned && styles.itemPriceScanned]}>€{item.price.toFixed(2)}</Text>
                          <Text style={styles.packageHint}>
                            {item.packagesNeeded}x {item.packageSize}{item.unit}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        
        {leftoverItems.length > 0 && (
          <>
            <View style={styles.leftoverHeader}>
              <Text style={styles.sectionTitle}>Leftovers</Text>
              <Text style={styles.leftoverSubtitle}>
                What you&apos;ll buy vs what you need (~€{totalLeftoverValue.toFixed(2)} value)
              </Text>
            </View>
            
            {Object.entries(groupedLeftovers).map(([category, items]) => {
              const isExpanded = expandedLeftoverCategories.has(category);
              const categoryLeftoverValue = items.reduce((sum, item) => {
                const leftoverPercentage = item.leftover / item.totalBought;
                return sum + (item.price * leftoverPercentage);
              }, 0);
              
              return (
                <View key={`leftover-${category}`} style={styles.categoryContainer}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleLeftoverCategory(category)}
                  >
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.leftoverValue}>~€{categoryLeftoverValue.toFixed(2)}</Text>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.itemsContainer}>
                      {items.map((item, idx) => {
                        const leftoverPercentage = (item.leftover / item.totalBought) * 100;
                        return (
                          <View key={`leftover-${item.name}-${idx}`} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={styles.leftoverAmount}>
                                Leftover: {Math.round(item.leftover)}{item.unit} ({Math.round(leftoverPercentage)}% of package)
                              </Text>
                              <Text style={styles.leftoverDetail}>
                                Need {Math.round(item.needed)}{item.unit} • Buy {Math.round(item.totalBought)}{item.unit}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Copy list</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Download size={16} color="#D4A574" />
          <Text style={styles.actionButtonText}>Save recipes as PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    maxWidth: 280,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scanButton: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6D1F3C',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scannedInfo: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  shareButton: {
    backgroundColor: '#6D1F3C',
    padding: 12,
    borderRadius: 20,
  },
  totalContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 14,
    color: '#666',
  },
  leftoverHint: {
    fontSize: 12,
    color: '#D4A574',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 12,
  },
  packageInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 4,
  },
  packageText: {
    fontSize: 13,
    color: '#6D1F3C',
    fontWeight: '600' as const,
  },
  packageHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  itemRowScanned: {
    backgroundColor: '#f0fdf4',
  },
  itemNameScanned: {
    color: '#059669',
  },
  itemPriceScanned: {
    textDecorationLine: 'line-through' as const,
    color: '#999',
  },
  scannedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scannedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600' as const,
  },
  leftoverHeader: {
    marginTop: 32,
    marginBottom: 12,
  },
  leftoverSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  leftoverValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#D4A574',
  },
  leftoverAmount: {
    fontSize: 14,
    color: '#D4A574',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  leftoverDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D1F3C',
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 14,
    color: '#666',
  },
  itemNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemRecipes: {
    fontSize: 11,
    color: '#6D1F3C',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unitPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4A574',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A574',
  },
});