import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, RefreshCw, Trash2, Edit3, Heart } from 'lucide-react-native';
import { useMealPlanner } from '@/hooks/meal-planner-store';

import OnboardingScreen from '@/components/OnboardingScreen';

export default function ProfileScreen() {
  const { 
    preferences, 
    generateMealPlan, 
    resetApp,
    isTasteProfileComplete,
    resetTasteProfile
  } = useMealPlanner();
  const [showEditPreferences, setShowEditPreferences] = useState(false);

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will clear all your preferences and meal plans. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetApp();
              Alert.alert('Reset Complete', 'The app has been reset successfully. You will now see the onboarding screen.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset the app. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRetakeTasteQuiz = () => {
    Alert.alert(
      'Retake Taste Quiz',
      'This will reset your taste profile and show you the quiz again. Your preferences and meal plans will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake Quiz',
          onPress: async () => {
            try {
              await resetTasteProfile();
              Alert.alert('Quiz Reset', 'Your taste profile has been reset. You\'ll see the quiz the next time you open the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset the taste profile. Please try again.');
            }
          }
        }
      ]
    );
  };

  const dietLabels = {
    any: 'Any',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    keto: 'Keto',
    paleo: 'Paleo',
    mediterranean: 'Mediterranean'
  };

  const goalLabels: Record<string, string> = {
    healthy: 'Eat Healthier',
    budget: 'Save Money',
    'no-waste': 'Reduce Waste',
    tracking: 'Track Nutrition'
  };

  const mealMixLabels = {
    balanced: 'Balanced',
    'more-meat': 'More Meat',
    'more-veg': 'More Vegetables'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#6D1F3C" />
        <Text style={styles.title}>Profile & Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Preferences</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Goals</Text>
              <Text style={styles.preferenceValue}>
                {preferences.goals.map(goal => goalLabels[goal]).join(', ')}
              </Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Diet</Text>
              <Text style={styles.preferenceValue}>{dietLabels[preferences.diet]}</Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Meal Mix</Text>
              <Text style={styles.preferenceValue}>{mealMixLabels[preferences.mealMix]}</Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>People</Text>
              <Text style={styles.preferenceValue}>{preferences.persons}</Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Weekly Budget</Text>
              <Text style={styles.preferenceValue}>€{preferences.budgetPerWeek}</Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Max Time per Meal</Text>
              <Text style={styles.preferenceValue}>{preferences.maxTimePerMeal} min</Text>
            </View>
          </View>

          {preferences.allergies.length > 0 && (
            <View style={styles.preferenceCard}>
              <Text style={styles.cardTitle}>Allergies</Text>
              <View style={styles.tagContainer}>
                {preferences.allergies.map((allergy) => (
                  <View key={allergy} style={styles.tag}>
                    <Text style={styles.tagText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {preferences.dislikes.length > 0 && (
            <View style={styles.preferenceCard}>
              <Text style={styles.cardTitle}>Dislikes</Text>
              <View style={styles.tagContainer}>
                {preferences.dislikes.map((dislike) => (
                  <View key={dislike} style={styles.tag}>
                    <Text style={styles.tagText}>{dislike}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {preferences.notes && (
            <View style={styles.preferenceCard}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.notesText}>{preferences.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowEditPreferences(true)}
          >
            <Edit3 size={20} color="#6D1F3C" />
            <Text style={styles.actionButtonText}>Edit Preferences</Text>
          </TouchableOpacity>
          
          {isTasteProfileComplete && (
            <TouchableOpacity style={styles.actionButton} onPress={handleRetakeTasteQuiz}>
              <Heart size={20} color="#6D1F3C" />
              <Text style={styles.actionButtonText}>Retake Taste Quiz</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={generateMealPlan}>
            <RefreshCw size={20} color="#6D1F3C" />
            <Text style={styles.actionButtonText}>Generate New Meal Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleResetApp}>
            <Trash2 size={20} color="#dc3545" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Reset App</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>RubyChef</Text>
            <Text style={styles.aboutText}>
              Your personal meal planning assistant. Get curated recipes, 
              automatic grocery lists, and personalized meal plans based on 
              your preferences and dietary needs.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showEditPreferences}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <OnboardingScreen 
          isEditing={true}
          onComplete={() => setShowEditPreferences(false)}
        />
      </Modal>
    </SafeAreaView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  preferenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6D1F3C',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D1F3C',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  dangerText: {
    color: '#dc3545',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6D1F3C',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
