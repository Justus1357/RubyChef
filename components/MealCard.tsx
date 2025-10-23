import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Clock, Users, RefreshCw, X } from 'lucide-react-native';
import { Recipe } from '@/types/meal';
import { useMealPlanner } from '@/hooks/meal-planner-store';

interface MealCardProps {
  recipe: Recipe;
  servings: number;
  onSwap: () => void;
  onPress: () => void;
  dayId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

export default function MealCard({ recipe, servings, onSwap, onPress, dayId, mealType }: MealCardProps) {
  const { removeRecipePermanently } = useMealPlanner();
  const [isSwapping, setIsSwapping] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);

  const handleSwap = () => {
    setIsSwapping(true);
    setPendingRemoval({ id: recipe.id, name: recipe.name });
    onSwap();
    setTimeout(() => {
      setShowRemoveModal(true);
    }, 500);
  };

  const handleKeepRecipe = () => {
    setShowRemoveModal(false);
    setIsSwapping(false);
    setPendingRemoval(null);
  };

  const handleRemoveForever = async () => {
    const targetId = pendingRemoval?.id ?? recipe.id;
    const targetName = pendingRemoval?.name ?? recipe.name;
    await removeRecipePermanently(targetId);
    setShowRemoveModal(false);
    setIsSwapping(false);
    setPendingRemoval(null);
    console.log(`Recipe "${targetName}" permanently removed from collection`);
  };
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress} testID={`meal-card-${recipe.id}`}>
      <Image 
        source={{ uri: recipe.image }} 
        style={styles.image}
        contentFit="cover"
        cachePolicy="disk"
        placeholder={require('@/assets/images/icon.png')}
        transition={300}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{recipe.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {recipe.description}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.swapButton, isSwapping && styles.swapButtonDisabled]} 
            onPress={(e) => {
              e.stopPropagation();
              if (!isSwapping) {
                handleSwap();
              }
            }}
            activeOpacity={0.7}
            disabled={isSwapping}
            testID={`swap-button-${dayId}-${mealType}`}
          >
            <RefreshCw size={16} color="#6D1F3C" />
            <Text style={[styles.swapText, isSwapping && styles.swapTextDisabled]}>
              {isSwapping ? 'Swapping...' : 'Swap'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.info}>
            <Clock size={14} color="#666" />
            <Text style={styles.infoText}>{recipe.cookTime}min</Text>
          </View>
          
          <View style={styles.servingsContainer}>
            <Users size={14} color="#666" />
            <Text style={styles.servingsText}>{servings} servings</Text>
          </View>
        </View>
      </View>
      </TouchableOpacity>
      
      <Modal
      visible={showRemoveModal}
      transparent
      animationType="fade"
      onRequestClose={handleKeepRecipe}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Remove Recipe Forever?</Text>
            <TouchableOpacity onPress={handleKeepRecipe} style={styles.closeButton} testID="close-remove-modal">
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalMessage}>
            Do you want to permanently remove &ldquo;{pendingRemoval?.name ?? recipe.name}&rdquo; from your recipe collection? 
            This will prevent it from appearing in future meal plans.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.keepButton} 
              onPress={handleKeepRecipe}
              testID="keep-recipe-button"
            >
              <Text style={styles.keepButtonText}>Keep Recipe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={handleRemoveForever}
              testID="remove-forever-button"
            >
              <Text style={styles.removeButtonText}>Remove Forever</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fdf0f4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6D1F3C',
    gap: 4,
  },
  swapText: {
    fontSize: 12,
    color: '#6D1F3C',
    fontWeight: '600',
  },
  swapButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  swapTextDisabled: {
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6D1F3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  servingsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  keepButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  keepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  removeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#dc3545',
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});