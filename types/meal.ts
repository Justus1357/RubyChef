export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  price: number;
  category: string;
  packageSize: number;
  pricePerPackage: number;
}

export interface MealPlan {
  id: string;
  date: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
}

export interface Supermarket {
  id: string;
  name: string;
  distance: number;
  address: string;
  type: 'lidl' | 'aldi' | 'rewe' | 'edeka' | 'netto' | 'walmart' | 'target' | 'kroger' | 'wholefoods' | 'traderjoes' | 'costco' | 'ica' | 'coop' | 'willys' | 'hemkop' | 'citygross' | 'other';
}

export interface Person {
  id: string;
  name: string;
  avatar?: string;
}

export interface UserPreferences {
  diet: 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  mealMix: 'balanced' | 'more-meat' | 'more-veg';
  persons: number;
  householdMembers: Person[];
  budgetPerWeek: number;
  maxTimePerMeal: number;
  maxTimeBreakfast: number;
  maxTimeLunch: number;
  maxTimeDinner: number;
  allergies: string[];
  dislikes: string[];
  goals: ('healthy' | 'budget' | 'no-waste' | 'tracking')[];
  notes: string;
  eatingOutDays: string[];
  postalCode?: string;
  nearbySupermarkets?: Supermarket[];
  selectedSupermarket?: Supermarket;
  unitSystem: 'metric' | 'imperial';
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  price: number;
  category: string;
  recipes: string[];
  packagesNeeded?: number;
  packageSize?: number;
  packagePrice?: number;
}