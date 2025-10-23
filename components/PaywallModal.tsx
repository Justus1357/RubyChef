import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Sparkles, Filter, Download, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (withTrial: boolean) => void;
}

export default function PaywallModal({ visible, onClose, onSubscribe }: PaywallModalProps) {
  const [withTrial, setWithTrial] = useState(true);

  const handleSubscribe = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubscribe?.(withTrial);
  };

  const features = [
    {
      icon: Sparkles,
      title: 'Unlimited Swaps',
      description: 'Change any meal with one tap, no limits',
    },
    {
      icon: Filter,
      title: 'Advanced Filters',
      description: 'Keto, Vegan, Gluten-free and more',
    },
    {
      icon: BarChart3,
      title: 'Pantry Insights',
      description: 'See what you can cook with what you have',
    },
    {
      icon: Download,
      title: 'Export & Share',
      description: 'Save grocery lists as PDF or share recipes',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Sparkles size={48} color="#6D1F3C" />
            </View>
            <Text style={styles.title}>Upgrade to RubyChef Pro</Text>
            <Text style={styles.subtitle}>
              Unlock all features and make meal planning even easier
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIconContainer}>
                  <feature.icon size={24} color="#6D1F3C" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <View style={styles.checkIcon}>
                  <Check size={20} color="#10b981" />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.trialContainer}>
            <View style={styles.trialToggle}>
              <View style={styles.trialInfo}>
                <Text style={styles.trialTitle}>7-Day Free Trial</Text>
                <Text style={styles.trialDescription}>
                  Try all features risk-free, cancel anytime
                </Text>
              </View>
              <Switch
                value={withTrial}
                onValueChange={setWithTrial}
                trackColor={{ false: '#e9ecef', true: '#6D1F3C' }}
                thumbColor={withTrial ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#e9ecef"
              />
            </View>
          </View>

          <View style={styles.pricingContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {withTrial ? 'After trial:' : 'Price:'}
              </Text>
              <Text style={styles.priceValue}>€4.99/month</Text>
            </View>
            {withTrial && (
              <Text style={styles.trialNote}>
                First 7 days free, then €4.99/mo. Cancel anytime before trial ends.
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>
              {withTrial ? 'Start Free Trial' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Payment will be charged to your App Store account
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fdf0f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fdf0f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fdf0f4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#6D1F3C',
  },
  trialInfo: {
    flex: 1,
    marginRight: 16,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trialDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6D1F3C',
  },
  trialNote: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  subscribeButton: {
    backgroundColor: '#6D1F3C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
