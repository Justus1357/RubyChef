import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, ChefHat, Heart, MapPin, Store } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useMealPlanner } from '@/hooks/meal-planner-store';
import { UserPreferences, Supermarket, Person } from '@/types/meal';

const STEPS = [
  'Welcome',
  'Unit System',
  'Name',
  'Goals',
  'Bio Preference',
  'Location',
  'Allergies',
  'Special Focus',
  'Diet Type',
  'Household',
  'Activity',
  'Body Metrics',
  'Main Meal',
  'Time Available'
];

interface OnboardingScreenProps {
  isEditing?: boolean;
  onComplete?: () => void;
}

export default function OnboardingScreen({ isEditing = false, onComplete }: OnboardingScreenProps) {
  const { preferences, updatePreferences, completeOnboarding } = useMealPlanner();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [userName, setUserName] = useState('');
  const [selectedStore, setSelectedStore] = useState<Supermarket | null>(preferences.selectedSupermarket || null);
  const [bioPreference, setBioPreference] = useState<'bio' | 'guenstig'>('guenstig');
  const [specialFocus, setSpecialFocus] = useState<('high-protein' | 'low-carb')[]>([]);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [mainMeal, setMainMeal] = useState<'lunch' | 'dinner'>('dinner');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [isScanningStores, setIsScanningStores] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(preferences.unitSystem || 'metric');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await updatePreferences(formData);
    if (!isEditing) {
      await completeOnboarding();
    }
    if (onComplete) {
      onComplete();
    }
  };

  const updateFormData = (field: keyof UserPreferences, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const detectCountryFromCoords = (lat: number, lon: number): 'US' | 'SE' | 'DE' | 'unknown' => {
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
      return 'US';
    }
    if (lat >= 55 && lat <= 70 && lon >= 10 && lon <= 25) {
      return 'SE';
    }
    if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 15) {
      return 'DE';
    }
    return 'unknown';
  };

  const getDefaultSupermarketsForCountry = (country: 'US' | 'SE' | 'DE' | 'unknown'): Supermarket[] => {
    const defaults: Record<string, Supermarket[]> = {
      US: [
        { id: 'default-us-1', name: 'Walmart', distance: 2.5, address: 'Nearby location', type: 'walmart' },
        { id: 'default-us-2', name: 'Target', distance: 3.0, address: 'Nearby location', type: 'target' },
        { id: 'default-us-3', name: 'Kroger', distance: 3.5, address: 'Nearby location', type: 'kroger' },
        { id: 'default-us-4', name: 'Whole Foods Market', distance: 4.0, address: 'Nearby location', type: 'wholefoods' },
        { id: 'default-us-5', name: "Trader Joe's", distance: 4.5, address: 'Nearby location', type: 'traderjoes' },
      ],
      SE: [
        { id: 'default-se-1', name: 'ICA', distance: 1.5, address: 'Nearby location', type: 'ica' },
        { id: 'default-se-2', name: 'Coop', distance: 2.0, address: 'Nearby location', type: 'coop' },
        { id: 'default-se-3', name: 'Willys', distance: 2.5, address: 'Nearby location', type: 'willys' },
        { id: 'default-se-4', name: 'Hemköp', distance: 3.0, address: 'Nearby location', type: 'hemkop' },
        { id: 'default-se-5', name: 'City Gross', distance: 3.5, address: 'Nearby location', type: 'citygross' },
      ],
      DE: [
        { id: 'default-de-1', name: 'Lidl', distance: 1.0, address: 'Nearby location', type: 'lidl' },
        { id: 'default-de-2', name: 'ALDI', distance: 1.5, address: 'Nearby location', type: 'aldi' },
        { id: 'default-de-3', name: 'REWE', distance: 2.0, address: 'Nearby location', type: 'rewe' },
        { id: 'default-de-4', name: 'EDEKA', distance: 2.5, address: 'Nearby location', type: 'edeka' },
        { id: 'default-de-5', name: 'Netto', distance: 3.0, address: 'Nearby location', type: 'netto' },
      ],
      unknown: [
        { id: 'default-unk-1', name: 'Lidl', distance: 2.0, address: 'Nearby location', type: 'lidl' },
        { id: 'default-unk-2', name: 'ALDI', distance: 2.5, address: 'Nearby location', type: 'aldi' },
        { id: 'default-unk-3', name: 'Local Supermarket', distance: 3.0, address: 'Nearby location', type: 'other' },
      ]
    };
    
    return defaults[country] || defaults.unknown;
  };

  const requestLocationAndScan = async () => {
    setIsScanningStores(true);
    setLocationError(null);
    console.log('🔍 Requesting location permission...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location access in your device settings.');
        console.error('Location permission denied');
        
        const defaultStores = getDefaultSupermarketsForCountry('unknown');
        updateFormData('nearbySupermarkets', defaultStores);
        setIsScanningStores(false);
        return;
      }

      console.log('✅ Location permission granted');
      
      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      console.log(`✅ Location found: ${latitude}, ${longitude}`);
      
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      console.log('📍 Address found:', reverseGeocode);
      
      const country = detectCountryFromCoords(latitude, longitude);
      console.log('Detected country:', country);
      
      let foundSupermarkets: Supermarket[] = [];
      
      const lat = latitude.toString();
      const lon = longitude.toString();
      
      console.log('Step 2: Searching for supermarkets...');
      const radius = 5000;
      const overpassQuery = `
        [out:json][timeout:15];
        (
          node["shop"="supermarket"](around:${radius},${lat},${lon});
          way["shop"="supermarket"](around:${radius},${lat},${lon});
        );
        out center 20;
      `;
      
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      console.log('Overpass query:', overpassQuery);
      
      try {
        const supermarketsResponse = await fetch(overpassUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodeURIComponent(overpassQuery)}`
        });
        
        if (supermarketsResponse.ok) {
          const supermarketsData = await supermarketsResponse.json();
          console.log('Overpass response:', supermarketsData);
          
          if (supermarketsData.elements && supermarketsData.elements.length > 0) {
            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
              const R = 6371;
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              return R * c;
            };
            
            const detectSupermarketType = (name: string): Supermarket['type'] => {
              const nameLower = name.toLowerCase();
              if (nameLower.includes('walmart')) return 'walmart';
              if (nameLower.includes('target')) return 'target';
              if (nameLower.includes('kroger')) return 'kroger';
              if (nameLower.includes('whole foods')) return 'wholefoods';
              if (nameLower.includes('trader joe')) return 'traderjoes';
              if (nameLower.includes('costco')) return 'costco';
              if (nameLower.includes('lidl')) return 'lidl';
              if (nameLower.includes('aldi')) return 'aldi';
              if (nameLower.includes('rewe')) return 'rewe';
              if (nameLower.includes('edeka')) return 'edeka';
              if (nameLower.includes('netto')) return 'netto';
              if (nameLower.includes('ica')) return 'ica';
              if (nameLower.includes('coop')) return 'coop';
              if (nameLower.includes('willys')) return 'willys';
              if (nameLower.includes('hemköp') || nameLower.includes('hemkop')) return 'hemkop';
              if (nameLower.includes('city gross')) return 'citygross';
              return 'other';
            };
            
            foundSupermarkets = supermarketsData.elements
              .map((element: any) => {
                const storeLat = element.lat || element.center?.lat;
                const storeLon = element.lon || element.center?.lon;
                
                if (!storeLat || !storeLon) return null;
                
                const name = element.tags?.name || element.tags?.brand || 'Supermarket';
                
                const street = element.tags?.['addr:street'];
                const housenumber = element.tags?.['addr:housenumber'];
                const city = element.tags?.['addr:city'];
                const postcode = element.tags?.['addr:postcode'];
                
                const addressParts: string[] = [];
                if (street && housenumber) {
                  addressParts.push(`${street} ${housenumber}`);
                } else if (street) {
                  addressParts.push(street);
                }
                if (postcode && city) {
                  addressParts.push(`${postcode} ${city}`);
                } else if (city) {
                  addressParts.push(city);
                } else if (postcode) {
                  addressParts.push(postcode);
                }
                
                const address = addressParts.length > 0 
                  ? addressParts.join(', ')
                  : 'Address unavailable';
                
                const distance = calculateDistance(
                  parseFloat(lat),
                  parseFloat(lon),
                  storeLat,
                  storeLon
                );
                
                return {
                  id: element.id.toString(),
                  name,
                  distance: Math.round(distance * 10) / 10,
                  address,
                  type: detectSupermarketType(name)
                };
              })
              .filter((store: any): store is Supermarket => store !== null)
              .sort((a: Supermarket, b: Supermarket) => a.distance - b.distance)
              .slice(0, 10);
          }
        }
      } catch (error) {
        console.warn('Overpass API failed:', error);
      }
      
      if (foundSupermarkets.length === 0) {
        console.log('Using default supermarkets for country:', country);
        foundSupermarkets = getDefaultSupermarketsForCountry(country);
      }
      
      console.log(`✅ Found ${foundSupermarkets.length} supermarkets:`);
      foundSupermarkets.forEach(store => {
        console.log(`  - ${store.name} (${store.type}) - ${store.distance}km - ${store.address}`);
      });

      updateFormData('nearbySupermarkets', foundSupermarkets);
      if (foundSupermarkets.length > 0 && !selectedStore) {
        setSelectedStore(foundSupermarkets[0]);
        updateFormData('selectedSupermarket', foundSupermarkets[0]);
      }
      
      console.log('✅ Supermarket scan completed successfully');
    } catch (error) {
      console.error('❌ Error scanning for supermarkets:', error);
      setLocationError('Failed to get location. Using default supermarkets.');
      
      const defaultStores = getDefaultSupermarketsForCountry('unknown');
      console.log('Using fallback default supermarkets');
      updateFormData('nearbySupermarkets', defaultStores);
    } finally {
      setIsScanningStores(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconContainer}>
              <ChefHat size={80} color="#6D1F3C" />
            </View>
            
            <Text style={styles.welcomeTitle}>Welcome to RubyChef!</Text>
            <Text style={styles.welcomeSubtitle}>
              Let&apos;s create your personalized meal plan. We&apos;ll ask you a few questions to tailor recipes to your needs.
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>⏱️</Text>
                <Text style={styles.featureText}>Save time on meal planning</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🥗</Text>
                <Text style={styles.featureText}>Eat healthier with balanced meals</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>💰</Text>
                <Text style={styles.featureText}>Save money with smart shopping</Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Unit System</Text>
            <Text style={styles.centeredSubtitle}>Which unit system would you like to use?</Text>
            
            <View style={styles.illustrationPlaceholder}>
              <ChefHat size={80} color="#6D1F3C" />
            </View>
            
            <Text style={styles.questionText}>Choose your preferred measurement system</Text>
            
            <View style={styles.unitSystemContainer}>
              <TouchableOpacity
                style={[
                  styles.unitSystemCard,
                  unitSystem === 'metric' && styles.unitSystemCardSelected
                ]}
                onPress={() => {
                  setUnitSystem('metric');
                  updateFormData('unitSystem', 'metric');
                }}
              >
                <View style={[
                  styles.unitSystemIconCircle,
                  unitSystem === 'metric' && styles.unitSystemIconCircleSelected
                ]}>
                  <Text style={styles.unitSystemIcon}>📏</Text>
                </View>
                <Text style={styles.unitSystemTitle}>Metric</Text>
                <Text style={styles.unitSystemDesc}>Grams, Celsius, Liters</Text>
                <Text style={styles.unitSystemExample}>500g, 180°C, 250ml</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.unitSystemCard,
                  unitSystem === 'imperial' && styles.unitSystemCardSelected
                ]}
                onPress={() => {
                  setUnitSystem('imperial');
                  updateFormData('unitSystem', 'imperial');
                }}
              >
                <View style={[
                  styles.unitSystemIconCircle,
                  unitSystem === 'imperial' && styles.unitSystemIconCircleSelected
                ]}>
                  <Text style={styles.unitSystemIcon}>📐</Text>
                </View>
                <Text style={styles.unitSystemTitle}>Imperial</Text>
                <Text style={styles.unitSystemDesc}>Ounces, Fahrenheit, Cups</Text>
                <Text style={styles.unitSystemExample}>1 lb, 350°F, 1 cup</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>All recipes and ingredient quantities will be displayed in your preferred unit system. You can change this later in settings.</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Welcome to RubyChef!</Text>
            <Text style={styles.centeredSubtitle}>What should we call you?</Text>
            
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>What Can We Help You With?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            
            <View style={styles.goalsContainer}>
              {[
                { key: 'time', label: 'Save Time', icon: '⏱️' },
                { key: 'healthy', label: 'Eat Healthier', icon: '🍎' },
                { key: 'budget', label: 'Save Money', icon: '💰' },
                { key: 'weight-loss', label: 'Lose Weight', icon: '🏃' },
                { key: 'muscle', label: 'Build Muscle', icon: '💪' },
                { key: 'discover', label: 'Discover New Recipes', icon: '✨' },
                { key: 'climate', label: 'Live Climate-Friendly', icon: '🌍' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.goalCard,
                    formData.goals.includes(option.key as any) && styles.goalCardSelected
                  ]}
                  onPress={() => {
                    const currentGoals = formData.goals;
                    if (currentGoals.includes(option.key as any)) {
                      updateFormData('goals', currentGoals.filter(g => g !== option.key));
                    } else {
                      updateFormData('goals', [...currentGoals, option.key]);
                    }
                  }}
                >
                  <Text style={styles.goalIcon}>{option.icon}</Text>
                  <Text style={styles.goalLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>How important is organic?</Text>
            
            <View style={styles.illustrationPlaceholder}>
              <ChefHat size={80} color="#6D1F3C" />
            </View>
            
            <Text style={styles.questionText}>What matters more to you?</Text>
            
            <View style={styles.bioOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.bioOptionCard,
                  bioPreference === 'bio' && styles.bioOptionCardSelected
                ]}
                onPress={() => setBioPreference('bio')}
              >
                <View style={styles.bioIconCircle}>
                  <Text style={styles.bioIconText}>🏅</Text>
                </View>
                <Text style={styles.bioOptionTitle}>Organic</Text>
                <Text style={styles.bioOptionDesc}>High quality, usually more expensive</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.bioOptionCard,
                  bioPreference === 'guenstig' && styles.bioOptionCardSelected
                ]}
                onPress={() => setBioPreference('guenstig')}
              >
                <View style={[styles.bioIconCircle, styles.bioIconCircleSelected]}>
                  <Text style={styles.bioIconText}>💶</Text>
                </View>
                <Text style={styles.bioOptionTitle}>Budget-Friendly</Text>
                <Text style={styles.bioOptionDesc}>Best value for money</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>Why do we ask? This helps us recommend recipes that match your budget and values.</Text>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Where do you shop?</Text>
            <Text style={styles.stepSubtitle}>
              We&apos;ll use your location to find nearby supermarkets and help optimize your meal planning and grocery shopping.
            </Text>

            <View style={styles.locationContainer}>
              <View style={styles.locationInfoBox}>
                <MapPin size={24} color="#6D1F3C" />
                <View style={styles.locationInfoText}>
                  <Text style={styles.locationInfoTitle}>Location Access</Text>
                  <Text style={styles.locationInfoDesc}>
                    We need your location to find supermarkets near you. Your location data is only used for this purpose.
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isScanningStores && styles.scanButtonDisabled
                ]}
                onPress={requestLocationAndScan}
                disabled={isScanningStores}
              >
                {isScanningStores ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Store size={20} color="#fff" />
                )}
                <Text style={styles.scanButtonText}>
                  {isScanningStores ? 'Finding Stores...' : 'Find Nearby Stores'}
                </Text>
              </TouchableOpacity>
              
              {locationError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{locationError}</Text>
                </View>
              )}
            </View>

            {formData.nearbySupermarkets && formData.nearbySupermarkets.length > 0 && (
              <View style={styles.supermarketsContainer}>
                <Text style={styles.supermarketsTitle}>🏪 Select Your Store</Text>
                <Text style={styles.supermarketsSubtitle}>
                  Choose where you usually shop. We&apos;ll optimize recipes based on your store&apos;s inventory.
                </Text>
                {formData.nearbySupermarkets.map(store => (
                  <TouchableOpacity 
                    key={store.id} 
                    style={[
                      styles.supermarketCard,
                      selectedStore?.id === store.id && styles.supermarketCardSelected
                    ]}
                    onPress={() => {
                      setSelectedStore(store);
                      updateFormData('selectedSupermarket', store);
                    }}
                  >
                    <View style={styles.supermarketInfo}>
                      <Text style={[
                        styles.supermarketName,
                        selectedStore?.id === store.id && styles.supermarketNameSelected
                      ]}>{store.name}</Text>
                      <Text style={styles.supermarketAddress}>{store.address}</Text>
                    </View>
                    <View style={[
                      styles.supermarketDistance,
                      selectedStore?.id === store.id && styles.supermarketDistanceSelected
                    ]}>
                      <Text style={[
                        styles.supermarketDistanceText,
                        selectedStore?.id === store.id && styles.supermarketDistanceTextSelected
                      ]}>{store.distance} km</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {selectedStore && (
                  <View style={styles.selectedStoreInfo}>
                    <Text style={styles.selectedStoreText}>✓ Shopping at {selectedStore.name}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
        
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Allergies & Intolerances</Text>
            
            <View style={styles.illustrationPlaceholder}>
              <Heart size={80} color="#6D1F3C" />
            </View>
            
            <View style={styles.allergiesGrid}>
              {[
                { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
                { key: 'nuts', label: 'Nuts', icon: '🥜' },
                { key: 'gluten', label: 'Gluten', icon: '🌾' },
                { key: 'lactose', label: 'Lactose', icon: '🥛' },
                { key: 'dairy', label: 'Dairy', icon: '🧀' },
                { key: 'shellfish', label: 'Shellfish', icon: '🦐' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.allergyCircle,
                    formData.allergies.includes(option.key) && styles.allergyCircleSelected
                  ]}
                  onPress={() => {
                    const currentAllergies = formData.allergies;
                    if (currentAllergies.includes(option.key)) {
                      updateFormData('allergies', currentAllergies.filter(a => a !== option.key));
                    } else {
                      updateFormData('allergies', [...currentAllergies, option.key]);
                    }
                  }}
                >
                  <View style={styles.allergyIconContainer}>
                    <Text style={styles.allergyIcon}>{option.icon}</Text>
                  </View>
                  <Text style={styles.allergyLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Special Focus</Text>
            
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
              <Text style={styles.premiumStar}>✨</Text>
            </View>
            
            <Text style={styles.questionText}>Should we optimize your plan for one of these goals?</Text>
            
            <View style={styles.specialFocusContainer}>
              <TouchableOpacity
                style={[
                  styles.specialFocusCard,
                  specialFocus.includes('high-protein') && styles.specialFocusCardSelected
                ]}
                onPress={() => {
                  if (specialFocus.includes('high-protein')) {
                    setSpecialFocus(specialFocus.filter(f => f !== 'high-protein'));
                  } else {
                    setSpecialFocus([...specialFocus, 'high-protein']);
                  }
                }}
              >
                <Text style={styles.specialFocusTitle}>High-Protein</Text>
                <Text style={styles.specialFocusIcon}>💪</Text>
                <Text style={styles.specialFocusDesc}>Yes, I want a protein-focused diet.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.specialFocusCard,
                  specialFocus.includes('low-carb') && styles.specialFocusCardSelected
                ]}
                onPress={() => {
                  if (specialFocus.includes('low-carb')) {
                    setSpecialFocus(specialFocus.filter(f => f !== 'low-carb'));
                  } else {
                    setSpecialFocus([...specialFocus, 'low-carb']);
                  }
                }}
              >
                <Text style={styles.specialFocusTitle}>Low-Carb</Text>
                <Text style={styles.specialFocusIcon}>🥦</Text>
                <Text style={styles.specialFocusDesc}>Yes, I want a plan with fewer carbs.</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Diet Type</Text>
            
            <View style={styles.dietTypeGrid}>
              {[
                { key: 'any', label: 'Omnivore', desc: 'No restrictions', icon: '🍖' },
                { key: 'flexitarian', label: 'Flexitarian', desc: 'Mostly plant-based', icon: '🥗' },
                { key: 'pescatarian', label: 'Pescatarian', desc: 'No meat, but fish', icon: '🐟' },
                { key: 'vegetarian', label: 'Vegetarian', desc: 'No meat, but eggs & dairy', icon: '🥚' },
                { key: 'vegan', label: 'Vegan', desc: 'Purely plant-based', icon: '🌱' },
              ].map(diet => (
                <TouchableOpacity
                  key={diet.key}
                  style={[
                    styles.dietTypeCard,
                    formData.diet === diet.key && styles.dietTypeCardSelected
                  ]}
                  onPress={() => updateFormData('diet', diet.key)}
                >
                  <View style={[
                    styles.dietTypeIconCircle,
                    formData.diet === diet.key && styles.dietTypeIconCircleSelected
                  ]}>
                    <Text style={styles.dietTypeIcon}>{diet.icon}</Text>
                  </View>
                  <Text style={styles.dietTypeLabel}>{diet.label}</Text>
                  <Text style={styles.dietTypeDesc}>{diet.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 9:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Your Household</Text>
            
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.householdEmoji}>👨‍👩‍👧‍👦</Text>
            </View>
            
            <Text style={styles.questionText}>Who eats with you?</Text>
            
            <View style={styles.householdCard}>
              <View style={styles.householdAvatar}>
                <Text style={styles.householdAvatarText}>{userName.charAt(0).toUpperCase() || 'K'}</Text>
              </View>
              <Text style={styles.householdName}>{userName || 'You'}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addPersonButton}
              onPress={() => {
                const newPerson: Person = {
                  id: `person-${Date.now()}`,
                  name: `Person ${formData.householdMembers.length + 2}`
                };
                updateFormData('householdMembers', [...formData.householdMembers, newPerson]);
                setEditingPersonId(newPerson.id);
                setEditingPersonName(newPerson.name);
              }}
            >
              <Text style={styles.addPersonButtonText}>+ Add Person</Text>
            </TouchableOpacity>
            
            {formData.householdMembers.length > 0 && (
              <View style={styles.householdMembersList}>
                {formData.householdMembers.map((member) => (
                  <View key={member.id} style={styles.householdCard}>
                    <View style={styles.householdAvatar}>
                      <Text style={styles.householdAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    {editingPersonId === member.id ? (
                      <TextInput
                        style={styles.householdNameInput}
                        value={editingPersonName}
                        onChangeText={setEditingPersonName}
                        onBlur={() => {
                          const updatedMembers = formData.householdMembers.map(m => 
                            m.id === member.id ? { ...m, name: editingPersonName || member.name } : m
                          );
                          updateFormData('householdMembers', updatedMembers);
                          setEditingPersonId(null);
                          setEditingPersonName('');
                        }}
                        placeholder="Enter name"
                        placeholderTextColor="#999"
                        autoFocus
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingPersonId(member.id);
                          setEditingPersonName(member.name);
                        }}
                        style={styles.householdNameTouchable}
                      >
                        <Text style={styles.householdName}>{member.name}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        const updatedMembers = formData.householdMembers.filter(m => m.id !== member.id);
                        updateFormData('householdMembers', updatedMembers);
                        if (editingPersonId === member.id) {
                          setEditingPersonId(null);
                          setEditingPersonName('');
                        }
                      }}
                      style={styles.removeMemberButton}
                    >
                      <Text style={styles.removeMemberText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 10:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>How active are you?</Text>
            
            <Text style={styles.sectionLabel}>Activity Level</Text>
            
            <View style={styles.activityContainer}>
              <TouchableOpacity
                style={[
                  styles.activityOption,
                  activityLevel === 'low' && styles.activityOptionSelected
                ]}
                onPress={() => setActivityLevel('low')}
              >
                <Text style={styles.activityTitle}>Low</Text>
                <Text style={styles.activityDesc}>Sedentary lifestyle, mainly sitting activities like office work.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.activityOption,
                  activityLevel === 'medium' && styles.activityOptionSelected
                ]}
                onPress={() => setActivityLevel('medium')}
              >
                <Text style={styles.activityTitle}>Medium</Text>
                <Text style={styles.activityDesc}>Regular movement through sports or physically demanding job.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.activityOption,
                  activityLevel === 'high' && styles.activityOptionSelected
                ]}
                onPress={() => setActivityLevel('high')}
              >
                <Text style={styles.activityTitle}>High</Text>
                <Text style={styles.activityDesc}>Very active lifestyle with intense physical work or sports.</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 11:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Help us personalize your plan</Text>
            
            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              {[
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' },
                { key: 'other', label: 'Other' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.genderButton,
                    gender === option.key && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender(option.key as any)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === option.key && styles.genderButtonTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricField}>
                <Text style={styles.sectionLabel}>Height</Text>
                <View style={styles.metricInputContainer}>
                  <TextInput
                    style={styles.metricInput}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="170"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.metricUnit}>cm</Text>
                </View>
              </View>
              
              <View style={styles.metricField}>
                <Text style={styles.sectionLabel}>Weight</Text>
                <View style={styles.metricInputContainer}>
                  <TextInput
                    style={styles.metricInput}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="70"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.metricUnit}>kg</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>This information helps optimize your plan for calorie and nutrient needs.</Text>
            </View>
          </View>
        );

      case 12:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Main Meal</Text>
            
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.householdEmoji}>🍽️</Text>
            </View>
            
            <Text style={styles.questionText}>What is usually your biggest meal: lunch or dinner?</Text>
            
            <View style={styles.mainMealContainer}>
              <TouchableOpacity
                style={[
                  styles.mainMealCard,
                  mainMeal === 'lunch' && styles.mainMealCardSelected
                ]}
                onPress={() => setMainMeal('lunch')}
              >
                <View style={[
                  styles.mainMealIconCircle,
                  mainMeal === 'lunch' && styles.mainMealIconCircleSelected
                ]}>
                  <Text style={styles.mainMealIcon}>☀️</Text>
                </View>
                <Text style={styles.mainMealLabel}>Lunch</Text>
                <Text style={styles.mainMealDesc}>Main meal at midday</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.mainMealCard,
                  mainMeal === 'dinner' && styles.mainMealCardSelected
                ]}
                onPress={() => setMainMeal('dinner')}
              >
                <View style={[
                  styles.mainMealIconCircle,
                  mainMeal === 'dinner' && styles.mainMealIconCircleSelected
                ]}>
                  <Text style={styles.mainMealIcon}>🌙</Text>
                </View>
                <Text style={styles.mainMealLabel}>Dinner</Text>
                <Text style={styles.mainMealDesc}>Main meal in evening</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 13:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.centeredTitle}>Time Available for Cooking</Text>
            <Text style={styles.stepSubtitle}>Select maximum time for each meal</Text>
            
            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Weekly Budget (EUR)</Text>
            <TextInput
              style={styles.budgetInput}
              value={formData.budgetPerWeek.toString()}
              onChangeText={(text) => updateFormData('budgetPerWeek', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="100"
            />

            <View style={styles.mealTimeContainer}>
              <View style={styles.mealTimeRow}>
                <View style={styles.mealTimeHeader}>
                  <Text style={styles.mealTimeLabel}>🌅 Breakfast</Text>
                  <Text style={styles.mealTimeValue}>{formData.maxTimeBreakfast >= 60 ? '60+ min' : `${formData.maxTimeBreakfast} min`}</Text>
                </View>
                <View style={styles.timeOptions}>
                  {[5, 10, 15, 20, 30, 45, 60].map(time => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        formData.maxTimeBreakfast === time && styles.timeButtonSelected
                      ]}
                      onPress={() => updateFormData('maxTimeBreakfast', time)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        formData.maxTimeBreakfast === time && styles.timeButtonTextSelected
                      ]}>
                        {time >= 60 ? '60+' : `${time}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.mealTimeRow}>
                <View style={styles.mealTimeHeader}>
                  <Text style={styles.mealTimeLabel}>☀️ Lunch</Text>
                  <Text style={styles.mealTimeValue}>{formData.maxTimeLunch >= 60 ? '60+ min' : `${formData.maxTimeLunch} min`}</Text>
                </View>
                <View style={styles.timeOptions}>
                  {[10, 15, 20, 30, 45, 60].map(time => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        formData.maxTimeLunch === time && styles.timeButtonSelected
                      ]}
                      onPress={() => updateFormData('maxTimeLunch', time)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        formData.maxTimeLunch === time && styles.timeButtonTextSelected
                      ]}>
                        {time >= 60 ? '60+' : `${time}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.eatingOutContainer}>
                  <View style={styles.eatingOutHeader}>
                    <Text style={styles.eatingOutLabel}>🍽️ Eating Out for Lunch</Text>
                    <Switch
                      value={formData.eatingOutDays.length > 0}
                      onValueChange={(value) => {
                        if (!value) {
                          updateFormData('eatingOutDays', []);
                        } else {
                          updateFormData('eatingOutDays', ['Monday']);
                        }
                      }}
                      trackColor={{ false: '#e9ecef', true: '#6D1F3C' }}
                      thumbColor={formData.eatingOutDays.length > 0 ? '#6D1F3C' : '#f4f3f4'}
                    />
                  </View>
                  
                  {formData.eatingOutDays.length > 0 && (
                    <View style={styles.daySelector}>
                      <Text style={styles.daySelectorLabel}>Select days:</Text>
                      <View style={styles.dayButtons}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayButton,
                              formData.eatingOutDays.includes(day) && styles.dayButtonSelected
                            ]}
                            onPress={() => {
                              const currentDays = formData.eatingOutDays;
                              if (currentDays.includes(day)) {
                                updateFormData('eatingOutDays', currentDays.filter(d => d !== day));
                              } else {
                                updateFormData('eatingOutDays', [...currentDays, day]);
                              }
                            }}
                          >
                            <Text style={[
                              styles.dayButtonText,
                              formData.eatingOutDays.includes(day) && styles.dayButtonTextSelected
                            ]}>
                              {day.substring(0, 3)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.mealTimeRow}>
                <View style={styles.mealTimeHeader}>
                  <Text style={styles.mealTimeLabel}>🌙 Dinner</Text>
                  <Text style={styles.mealTimeValue}>{formData.maxTimeDinner >= 60 ? '60+ min' : `${formData.maxTimeDinner} min`}</Text>
                </View>
                <View style={styles.timeOptions}>
                  {[15, 20, 30, 45, 60, 90].map(time => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        formData.maxTimeDinner === time && styles.timeButtonSelected
                      ]}
                      onPress={() => updateFormData('maxTimeDinner', time)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        formData.maxTimeDinner === time && styles.timeButtonTextSelected
                      ]}>
                        {time >= 90 ? '90+' : `${time}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RubyChef Setup</Text>
        <Text style={styles.subtitle}>Let&apos;s personalize your meal planning experience</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep + 1} of {STEPS.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} color={currentStep === 0 ? '#ccc' : '#666'} />
          <Text style={[styles.buttonText, currentStep === 0 && styles.buttonTextDisabled]}>
            {currentStep === 0 ? '' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 0 ? 'Get Started' : currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#6D1F3C',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 24,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6D1F3C',
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  centeredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  centeredSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  householdEmoji: {
    fontSize: 80,
  },
  featureEmoji: {
    fontSize: 28,
  },
  welcomeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fdf0f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  featureList: {
    width: '100%',
    gap: 24,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  nameInputContainer: {
    marginTop: 32,
  },
  nameInput: {
    fontSize: 18,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6D1F3C',
    textAlign: 'center',
  },
  goalsContainer: {
    gap: 12,
    marginTop: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  goalIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  bioOptionsContainer: {
    gap: 16,
    marginTop: 24,
  },
  bioOptionCard: {
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  bioOptionCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  bioIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bioIconCircleSelected: {
    backgroundColor: '#6D1F3C',
  },
  bioIconText: {
    fontSize: 40,
  },
  bioOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bioOptionDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F7F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
    justifyContent: 'space-around',
  },
  allergyCircle: {
    width: 100,
    alignItems: 'center',
    padding: 12,
  },
  allergyCircleSelected: {
    backgroundColor: '#E8F7F5',
    borderRadius: 12,
  },
  allergyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  allergyIcon: {
    fontSize: 32,
  },
  allergyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F5C563',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumStar: {
    fontSize: 18,
  },
  specialFocusContainer: {
    gap: 16,
    marginTop: 24,
  },
  specialFocusCard: {
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  specialFocusCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  specialFocusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  specialFocusIcon: {
    fontSize: 32,
    marginVertical: 8,
  },
  specialFocusDesc: {
    fontSize: 14,
    color: '#666',
  },
  dietTypeGrid: {
    gap: 16,
    marginTop: 24,
  },
  dietTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 16,
  },
  dietTypeCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  dietTypeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietTypeIconCircleSelected: {
    backgroundColor: '#6D1F3C',
  },
  dietTypeIcon: {
    fontSize: 28,
  },
  dietTypeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  dietTypeDesc: {
    fontSize: 14,
    color: '#666',
    position: 'absolute',
    bottom: 20,
    left: 96,
  },
  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  householdAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6D1F3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addPersonButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6D1F3C',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addPersonButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D1F3C',
  },
  personSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  personButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personButtonSelected: {
    backgroundColor: '#6D1F3C',
    borderColor: '#6D1F3C',
  },
  personButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  personButtonTextSelected: {
    color: '#fff',
  },
  activityContainer: {
    gap: 16,
    marginTop: 16,
  },
  activityOption: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityOptionSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  activityDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  genderButtonTextSelected: {
    color: '#6D1F3C',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricField: {
    flex: 1,
  },
  metricInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingRight: 16,
  },
  metricInput: {
    flex: 1,
    fontSize: 18,
    padding: 16,
  },
  metricUnit: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  mainMealContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  mainMealCard: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  mainMealCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  mainMealIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainMealIconCircleSelected: {
    backgroundColor: '#6D1F3C',
  },
  mainMealIcon: {
    fontSize: 40,
  },
  mainMealLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mainMealDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  budgetInput: {
    fontSize: 18,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  mealTimeContainer: {
    gap: 32,
    marginTop: 24,
  },
  mealTimeRow: {
    gap: 12,
  },
  mealTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D1F3C',
  },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 50,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#6D1F3C',
    borderColor: '#6D1F3C',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeButtonTextSelected: {
    color: '#fff',
  },
  eatingOutContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fdf0f4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6D1F3C',
  },
  eatingOutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eatingOutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  daySelector: {
    marginTop: 16,
  },
  daySelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  dayButtonSelected: {
    backgroundColor: '#6D1F3C',
    borderColor: '#6D1F3C',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  locationContainer: {
    gap: 16,
    marginBottom: 24,
  },
  locationInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
    gap: 12,
  },
  locationInfoText: {
    flex: 1,
  },
  locationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationInfoDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D1F3C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    lineHeight: 20,
  },
  supermarketsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fdf0f4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6D1F3C',
  },
  supermarketsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  supermarketsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  supermarketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  supermarketInfo: {
    flex: 1,
  },
  supermarketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  supermarketAddress: {
    fontSize: 13,
    color: '#666',
  },
  supermarketDistance: {
    backgroundColor: '#6D1F3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  supermarketDistanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  supermarketCardSelected: {
    borderWidth: 2,
    borderColor: '#6D1F3C',
  },
  supermarketNameSelected: {
    color: '#6D1F3C',
  },
  supermarketDistanceSelected: {
    backgroundColor: '#6D1F3C',
  },
  supermarketDistanceTextSelected: {
    color: '#fff',
  },
  selectedStoreInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F7F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedStoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6D1F3C',
  },
  householdMembersList: {
    gap: 12,
    marginTop: 12,
  },
  removeMemberButton: {
    position: 'absolute' as const,
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeMemberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  householdNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6D1F3C',
  },
  householdNameTouchable: {
    flex: 1,
  },
  unitSystemContainer: {
    gap: 16,
    marginTop: 24,
  },
  unitSystemCard: {
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center' as const,
  },
  unitSystemCardSelected: {
    borderColor: '#6D1F3C',
    backgroundColor: '#E8F7F5',
  },
  unitSystemIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  unitSystemIconCircleSelected: {
    backgroundColor: '#6D1F3C',
  },
  unitSystemIcon: {
    fontSize: 40,
  },
  unitSystemTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 8,
  },
  unitSystemDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  unitSystemExample: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#f8f9fa',
  },
  nextButton: {
    backgroundColor: '#6D1F3C',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
