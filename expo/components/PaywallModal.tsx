import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { X, Check, Sparkles, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

export default function PaywallModal({ visible, onClose, feature }: PaywallModalProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    const status = await AsyncStorage.getItem('premium_status');
    setIsPremium(status === 'true');
  };

  const handlePurchase = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setLoading(true);
    await AsyncStorage.setItem('premium_status', 'true');
    await AsyncStorage.setItem('premium_trial_start', new Date().toISOString());
    setIsPremium(true);
    setLoading(false);
    onClose();
  };

  const features = [
    { icon: '🔄', text: 'Unlimited meal swaps', premium: true },
    { icon: '🎯', text: 'Advanced diet filters (keto, vegan, paleo)', premium: true },
    { icon: '📊', text: 'Pantry coverage insights', premium: true },
    { icon: '📄', text: 'Export grocery list as PDF', premium: true },
    { icon: '🍽️', text: 'Weekly meal planner', premium: false },
    { icon: '🛒', text: 'Smart grocery lists', premium: false },
    { icon: '💰', text: 'Budget tracking', premium: false },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#333" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Sparkles size={40} color="#6D1F3C" />
              </View>
              <Text style={styles.title}>RubyChef Plus</Text>
              <Text style={styles.subtitle}>
                Unlock advanced features and take control of your meal planning
              </Text>
            </View>

            {feature && (
              <View style={styles.featureHighlight}>
                <Star size={20} color="#F5C563" />
                <Text style={styles.featureText}>
                  &quot;{feature}&quot; is a premium feature
                </Text>
              </View>
            )}

            <View style={styles.pricing}>
              <Text style={styles.priceLabel}>Starting at</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>€5.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <Text style={styles.trialText}>7-day free trial included</Text>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What you get:</Text>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    {feature.premium ? (
                      <Check size={18} color="#10b981" />
                    ) : (
                      <Text style={styles.featureEmoji}>{feature.icon}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.featureText2,
                    feature.premium && styles.premiumFeatureText
                  ]}>
                    {feature.text}
                  </Text>
                  {feature.premium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PLUS</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={loading || isPremium}
            >
              <Text style={styles.purchaseButtonText}>
                {isPremium ? '✓ Premium Active' : loading ? 'Processing...' : 'Start Free Trial'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Mock purchase for beta. No actual billing. Cancel anytime.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf0f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  pricing: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6D1F3C',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  trialText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  featureText2: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  premiumFeatureText: {
    color: '#333',
    fontWeight: '500',
  },
  premiumBadge: {
    backgroundColor: '#F5C563',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#6D1F3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#ccc',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
