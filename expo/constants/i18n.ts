import { UnitSystem } from './units';

export type Language = 'en-US' | 'en-GB';

export const getLanguageFromUnitSystem = (unitSystem: UnitSystem): Language => {
  return unitSystem === 'imperial' ? 'en-US' : 'en-GB';
};

export interface IngredientAlternatives {
  'en-US': string;
  'en-GB': string;
}

export const ingredientNames: Record<string, IngredientAlternatives> = {
  'eggplant': { 'en-US': 'eggplant', 'en-GB': 'aubergine' },
  'aubergine': { 'en-US': 'eggplant', 'en-GB': 'aubergine' },
  'cilantro': { 'en-US': 'cilantro', 'en-GB': 'coriander' },
  'coriander': { 'en-US': 'cilantro', 'en-GB': 'coriander' },
  'zucchini': { 'en-US': 'zucchini', 'en-GB': 'courgette' },
  'courgette': { 'en-US': 'zucchini', 'en-GB': 'courgette' },
  'arugula': { 'en-US': 'arugula', 'en-GB': 'rocket' },
  'rocket': { 'en-US': 'arugula', 'en-GB': 'rocket' },
  'bell pepper': { 'en-US': 'bell pepper', 'en-GB': 'pepper' },
  'scallion': { 'en-US': 'scallion', 'en-GB': 'spring onion' },
  'spring onion': { 'en-US': 'scallion', 'en-GB': 'spring onion' },
  'shrimp': { 'en-US': 'shrimp', 'en-GB': 'prawn' },
  'prawn': { 'en-US': 'shrimp', 'en-GB': 'prawn' },
  'cookie': { 'en-US': 'cookie', 'en-GB': 'biscuit' },
  'biscuit': { 'en-US': 'cookie', 'en-GB': 'biscuit' },
  'candy': { 'en-US': 'candy', 'en-GB': 'sweet' },
  'sweet': { 'en-US': 'candy', 'en-GB': 'sweet' },
  'fries': { 'en-US': 'fries', 'en-GB': 'chips' },
  'chips': { 'en-US': 'chips', 'en-GB': 'crisps' },
  'crisps': { 'en-US': 'chips', 'en-GB': 'crisps' },
  'ground beef': { 'en-US': 'ground beef', 'en-GB': 'minced beef' },
  'minced beef': { 'en-US': 'ground beef', 'en-GB': 'minced beef' },
};

export const localizeIngredientName = (
  ingredientName: string,
  language: Language
): string => {
  const lowerName = ingredientName.toLowerCase();
  
  for (const [key, alternatives] of Object.entries(ingredientNames)) {
    if (lowerName.includes(key)) {
      const localized = alternatives[language];
      return ingredientName.replace(new RegExp(key, 'gi'), localized);
    }
  }
  
  return ingredientName;
};

export const strings = {
  'en-US': {
    app: {
      name: 'RubyChef',
      tagline: 'Your personal meal planning assistant'
    },
    onboarding: {
      welcome: 'Welcome to RubyChef!',
      unitSystem: 'Which unit system would you like to use?',
      metric: 'Metric',
      metricDesc: 'Grams, Celsius, Liters',
      imperial: 'Imperial',
      imperialDesc: 'Ounces, Fahrenheit, Cups',
      continue: 'Continue',
      back: 'Back',
      getStarted: 'Get Started',
      complete: 'Complete'
    },
    settings: {
      title: 'Settings',
      unitSystem: 'Unit System',
      changeUnits: 'Change Unit System',
      metric: 'Metric (g, °C, L)',
      imperial: 'Imperial (oz, °F, cups)'
    },
    recipe: {
      servings: 'servings',
      cookTime: 'Cook Time',
      difficulty: 'Difficulty',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      ingredients: 'Ingredients',
      instructions: 'Instructions',
      nutrition: 'Nutrition'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm'
    }
  },
  'en-GB': {
    app: {
      name: 'RubyChef',
      tagline: 'Your personal meal planning assistant'
    },
    onboarding: {
      welcome: 'Welcome to RubyChef!',
      unitSystem: 'Which unit system would you like to use?',
      metric: 'Metric',
      metricDesc: 'Grams, Celsius, Litres',
      imperial: 'Imperial',
      imperialDesc: 'Ounces, Fahrenheit, Cups',
      continue: 'Continue',
      back: 'Back',
      getStarted: 'Get Started',
      complete: 'Complete'
    },
    settings: {
      title: 'Settings',
      unitSystem: 'Unit System',
      changeUnits: 'Change Unit System',
      metric: 'Metric (g, °C, L)',
      imperial: 'Imperial (oz, °F, cups)'
    },
    recipe: {
      servings: 'servings',
      cookTime: 'Cook Time',
      difficulty: 'Difficulty',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      ingredients: 'Ingredients',
      instructions: 'Instructions',
      nutrition: 'Nutrition'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm'
    }
  }
};

export const getString = (key: string, language: Language): string => {
  const keys = key.split('.');
  let value: any = strings[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
};
