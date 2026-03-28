export interface IngredientPriceData {
  pricePerUnit: number;
  packageSize: number;
  unit: string;
  category: string;
}

export const ingredientPrices: Record<string, IngredientPriceData> = {
  'broccoli': { pricePerUnit: 2.50, packageSize: 500, unit: 'g', category: 'Vegetables' },
  'zucchini': { pricePerUnit: 1.80, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'eggs': { pricePerUnit: 3.50, packageSize: 660, unit: 'g', category: 'Dairy' },
  'chicken breast': { pricePerUnit: 6.00, packageSize: 500, unit: 'g', category: 'Meat' },
  'salmon': { pricePerUnit: 12.00, packageSize: 500, unit: 'g', category: 'Fish' },
  'cod': { pricePerUnit: 10.00, packageSize: 500, unit: 'g', category: 'Fish' },
  'tuna': { pricePerUnit: 8.50, packageSize: 400, unit: 'g', category: 'Fish' },
  'shrimp': { pricePerUnit: 14.00, packageSize: 400, unit: 'g', category: 'Fish' },
  'beef': { pricePerUnit: 8.50, packageSize: 500, unit: 'g', category: 'Meat' },
  'ground beef': { pricePerUnit: 5.50, packageSize: 500, unit: 'g', category: 'Meat' },
  'pork': { pricePerUnit: 7.00, packageSize: 500, unit: 'g', category: 'Meat' },
  'turkey': { pricePerUnit: 6.50, packageSize: 500, unit: 'g', category: 'Meat' },
  'bacon': { pricePerUnit: 4.50, packageSize: 200, unit: 'g', category: 'Meat' },
  'sausage': { pricePerUnit: 5.00, packageSize: 400, unit: 'g', category: 'Meat' },
  'lamb': { pricePerUnit: 12.00, packageSize: 500, unit: 'g', category: 'Meat' },
  'tofu': { pricePerUnit: 2.50, packageSize: 400, unit: 'g', category: 'Protein' },
  'tempeh': { pricePerUnit: 3.50, packageSize: 300, unit: 'g', category: 'Protein' },
  'lentils': { pricePerUnit: 2.00, packageSize: 500, unit: 'g', category: 'Pantry' },
  'chickpeas': { pricePerUnit: 1.50, packageSize: 400, unit: 'g', category: 'Pantry' },
  'black beans': { pricePerUnit: 1.50, packageSize: 400, unit: 'g', category: 'Pantry' },
  'kidney beans': { pricePerUnit: 1.50, packageSize: 400, unit: 'g', category: 'Pantry' },
  'rice': { pricePerUnit: 2.50, packageSize: 1000, unit: 'g', category: 'Pantry' },
  'quinoa': { pricePerUnit: 4.50, packageSize: 500, unit: 'g', category: 'Pantry' },
  'pasta': { pricePerUnit: 1.20, packageSize: 500, unit: 'g', category: 'Pantry' },
  'spaghetti': { pricePerUnit: 1.20, packageSize: 500, unit: 'g', category: 'Pantry' },
  'noodles': { pricePerUnit: 1.80, packageSize: 400, unit: 'g', category: 'Pantry' },
  'bread': { pricePerUnit: 1.80, packageSize: 500, unit: 'g', category: 'Pantry' },
  'flour': { pricePerUnit: 1.50, packageSize: 1000, unit: 'g', category: 'Pantry' },
  'oats': { pricePerUnit: 2.50, packageSize: 500, unit: 'g', category: 'Pantry' },
  'milk': { pricePerUnit: 1.20, packageSize: 1000, unit: 'ml', category: 'Dairy' },
  'yogurt': { pricePerUnit: 2.50, packageSize: 500, unit: 'g', category: 'Dairy' },
  'greek yogurt': { pricePerUnit: 3.50, packageSize: 500, unit: 'g', category: 'Dairy' },
  'cheese': { pricePerUnit: 3.50, packageSize: 200, unit: 'g', category: 'Dairy' },
  'cheddar cheese': { pricePerUnit: 4.00, packageSize: 200, unit: 'g', category: 'Dairy' },
  'mozzarella': { pricePerUnit: 3.80, packageSize: 200, unit: 'g', category: 'Dairy' },
  'parmesan': { pricePerUnit: 4.50, packageSize: 200, unit: 'g', category: 'Dairy' },
  'feta': { pricePerUnit: 4.20, packageSize: 200, unit: 'g', category: 'Dairy' },
  'butter': { pricePerUnit: 2.50, packageSize: 250, unit: 'g', category: 'Dairy' },
  'cream': { pricePerUnit: 1.80, packageSize: 250, unit: 'ml', category: 'Dairy' },
  'sour cream': { pricePerUnit: 2.00, packageSize: 200, unit: 'g', category: 'Dairy' },
  'tomato': { pricePerUnit: 2.50, packageSize: 500, unit: 'g', category: 'Vegetables' },
  'tomatoes': { pricePerUnit: 2.50, packageSize: 500, unit: 'g', category: 'Vegetables' },
  'cherry tomatoes': { pricePerUnit: 3.00, packageSize: 250, unit: 'g', category: 'Vegetables' },
  'tomato sauce': { pricePerUnit: 1.50, packageSize: 400, unit: 'g', category: 'Pantry' },
  'onion': { pricePerUnit: 1.50, packageSize: 500, unit: 'g', category: 'Vegetables' },
  'garlic': { pricePerUnit: 1.50, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'bell pepper': { pricePerUnit: 2.00, packageSize: 300, unit: 'g', category: 'Vegetables' },
  'carrot': { pricePerUnit: 1.20, packageSize: 500, unit: 'g', category: 'Vegetables' },
  'celery': { pricePerUnit: 1.50, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'cucumber': { pricePerUnit: 1.00, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'lettuce': { pricePerUnit: 1.50, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'romaine lettuce': { pricePerUnit: 1.50, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'spinach': { pricePerUnit: 2.00, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'kale': { pricePerUnit: 2.50, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'cabbage': { pricePerUnit: 1.50, packageSize: 800, unit: 'g', category: 'Vegetables' },
  'cauliflower': { pricePerUnit: 2.00, packageSize: 600, unit: 'g', category: 'Vegetables' },
  'mushrooms': { pricePerUnit: 3.00, packageSize: 250, unit: 'g', category: 'Vegetables' },
  'eggplant': { pricePerUnit: 2.50, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'asparagus': { pricePerUnit: 3.50, packageSize: 250, unit: 'g', category: 'Vegetables' },
  'green beans': { pricePerUnit: 2.50, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'peas': { pricePerUnit: 2.00, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'corn': { pricePerUnit: 1.80, packageSize: 400, unit: 'g', category: 'Vegetables' },
  'potato': { pricePerUnit: 1.50, packageSize: 1000, unit: 'g', category: 'Vegetables' },
  'sweet potato': { pricePerUnit: 2.00, packageSize: 600, unit: 'g', category: 'Vegetables' },
  'avocado': { pricePerUnit: 1.50, packageSize: 200, unit: 'g', category: 'Fruits' },
  'banana': { pricePerUnit: 1.50, packageSize: 600, unit: 'g', category: 'Fruits' },
  'apple': { pricePerUnit: 2.00, packageSize: 600, unit: 'g', category: 'Fruits' },
  'orange': { pricePerUnit: 2.50, packageSize: 600, unit: 'g', category: 'Fruits' },
  'lemon': { pricePerUnit: 2.00, packageSize: 400, unit: 'g', category: 'Fruits' },
  'lime': { pricePerUnit: 2.00, packageSize: 300, unit: 'g', category: 'Fruits' },
  'berries': { pricePerUnit: 3.50, packageSize: 250, unit: 'g', category: 'Fruits' },
  'strawberries': { pricePerUnit: 3.50, packageSize: 250, unit: 'g', category: 'Fruits' },
  'blueberries': { pricePerUnit: 4.00, packageSize: 200, unit: 'g', category: 'Fruits' },
  'raspberries': { pricePerUnit: 4.50, packageSize: 150, unit: 'g', category: 'Fruits' },
  'mango': { pricePerUnit: 2.50, packageSize: 400, unit: 'g', category: 'Fruits' },
  'pineapple': { pricePerUnit: 2.00, packageSize: 800, unit: 'g', category: 'Fruits' },
  'olive oil': { pricePerUnit: 5.00, packageSize: 500, unit: 'ml', category: 'Pantry' },
  'vegetable oil': { pricePerUnit: 3.00, packageSize: 1000, unit: 'ml', category: 'Pantry' },
  'coconut oil': { pricePerUnit: 6.00, packageSize: 400, unit: 'ml', category: 'Pantry' },
  'soy sauce': { pricePerUnit: 2.50, packageSize: 250, unit: 'ml', category: 'Condiments' },
  'vinegar': { pricePerUnit: 1.50, packageSize: 500, unit: 'ml', category: 'Condiments' },
  'honey': { pricePerUnit: 4.50, packageSize: 350, unit: 'g', category: 'Pantry' },
  'sugar': { pricePerUnit: 1.00, packageSize: 1000, unit: 'g', category: 'Pantry' },
  'salt': { pricePerUnit: 0.50, packageSize: 500, unit: 'g', category: 'Pantry' },
  'pepper': { pricePerUnit: 2.00, packageSize: 100, unit: 'g', category: 'Pantry' },
  'paprika': { pricePerUnit: 2.50, packageSize: 50, unit: 'g', category: 'Pantry' },
  'cumin': { pricePerUnit: 2.50, packageSize: 50, unit: 'g', category: 'Pantry' },
  'oregano': { pricePerUnit: 2.00, packageSize: 30, unit: 'g', category: 'Pantry' },
  'basil': { pricePerUnit: 2.00, packageSize: 30, unit: 'g', category: 'Pantry' },
  'thyme': { pricePerUnit: 2.00, packageSize: 30, unit: 'g', category: 'Pantry' },
  'rosemary': { pricePerUnit: 2.00, packageSize: 30, unit: 'g', category: 'Pantry' },
  'parsley': { pricePerUnit: 1.50, packageSize: 50, unit: 'g', category: 'Vegetables' },
  'cilantro': { pricePerUnit: 1.50, packageSize: 50, unit: 'g', category: 'Vegetables' },
  'ginger': { pricePerUnit: 2.50, packageSize: 200, unit: 'g', category: 'Vegetables' },
  'almonds': { pricePerUnit: 5.50, packageSize: 200, unit: 'g', category: 'Nuts' },
  'walnuts': { pricePerUnit: 6.00, packageSize: 200, unit: 'g', category: 'Nuts' },
  'cashews': { pricePerUnit: 6.50, packageSize: 200, unit: 'g', category: 'Nuts' },
  'peanuts': { pricePerUnit: 3.50, packageSize: 300, unit: 'g', category: 'Nuts' },
  'peanut butter': { pricePerUnit: 4.00, packageSize: 350, unit: 'g', category: 'Pantry' },
  'granola': { pricePerUnit: 4.50, packageSize: 375, unit: 'g', category: 'Pantry' },
  'coconut milk': { pricePerUnit: 2.50, packageSize: 400, unit: 'ml', category: 'Pantry' },
  'almond milk': { pricePerUnit: 2.80, packageSize: 1000, unit: 'ml', category: 'Dairy' },
  'caesar dressing': { pricePerUnit: 2.80, packageSize: 250, unit: 'ml', category: 'Condiments' },
  'croutons': { pricePerUnit: 2.50, packageSize: 150, unit: 'g', category: 'Pantry' },
  'taco shells': { pricePerUnit: 2.50, packageSize: 12, unit: 'pcs', category: 'Pantry' },
};

export function getIngredientPrice(ingredientName: string, quantityG: number): {
  price: number;
  unit: string;
  category: string;
  packageSize: number;
  pricePerPackage: number;
} {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  let priceData = ingredientPrices[normalizedName];
  
  if (!priceData) {
    for (const [key, value] of Object.entries(ingredientPrices)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        priceData = value;
        break;
      }
    }
  }
  
  if (!priceData) {
    console.warn(`No price data found for ingredient: ${ingredientName}, using default`);
    priceData = { pricePerUnit: 2.00, packageSize: 500, unit: 'g', category: 'Other' };
  }
  
  const price = (quantityG / priceData.packageSize) * priceData.pricePerUnit;
  
  return {
    price: Math.max(0.01, price),
    unit: priceData.unit,
    category: priceData.category,
    packageSize: priceData.packageSize,
    pricePerPackage: priceData.pricePerUnit
  };
}
