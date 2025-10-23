import { getIngredientPrice } from '../data/ingredient-prices';

interface SourceIngredient {
  name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface SourceRecipe {
  id: string;
  title: string;
  diet: string;
  meal_type: string;
  cuisine: string;
  prep_time_min: number;
  cook_time_min: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: SourceIngredient[];
}

const recipeImages: Record<string, string> = {
  'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  'lunch': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'dinner': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
};

function generateInstructions(recipeName: string, ingredients: SourceIngredient[]): string[] {
  const hasProtein = ingredients.some(i => 
    i.name.toLowerCase().includes('chicken') || 
    i.name.toLowerCase().includes('beef') ||
    i.name.toLowerCase().includes('fish') ||
    i.name.toLowerCase().includes('salmon') ||
    i.name.toLowerCase().includes('egg')
  );
  
  const hasVegetables = ingredients.some(i => 
    i.name.toLowerCase().includes('broccoli') || 
    i.name.toLowerCase().includes('zucchini') ||
    i.name.toLowerCase().includes('pepper') ||
    i.name.toLowerCase().includes('tomato') ||
    i.name.toLowerCase().includes('spinach')
  );
  
  const instructions: string[] = [];
  
  instructions.push('Gather and prepare all ingredients');
  
  if (hasProtein) {
    instructions.push('Cook protein until done (internal temp 165°F for poultry, 145°F for fish)');
  }
  
  if (hasVegetables) {
    instructions.push('Sauté or steam vegetables until tender');
  }
  
  instructions.push('Combine all ingredients and season to taste');
  instructions.push('Serve hot and enjoy');
  
  return instructions;
}

function getDifficulty(cookTime: number): 'Easy' | 'Medium' | 'Hard' {
  if (cookTime <= 20) return 'Easy';
  if (cookTime <= 40) return 'Medium';
  return 'Hard';
}

function getTags(recipe: SourceRecipe): string[] {
  const tags: string[] = [];
  
  tags.push(recipe.meal_type);
  tags.push(recipe.diet);
  
  if (recipe.protein_g > 25) tags.push('high-protein');
  if (recipe.calories < 300) tags.push('low-calorie');
  if (recipe.carbs_g < 20) tags.push('low-carb');
  if (recipe.cook_time_min <= 20) tags.push('quick');
  
  const hasVegetables = recipe.ingredients.some(i => 
    ['broccoli', 'zucchini', 'spinach', 'kale', 'pepper', 'tomato'].some(v => 
      i.name.toLowerCase().includes(v)
    )
  );
  if (hasVegetables) tags.push('healthy');
  
  const hasMeat = recipe.ingredients.some(i => 
    ['chicken', 'beef', 'pork', 'lamb', 'turkey'].some(m => 
      i.name.toLowerCase().includes(m)
    )
  );
  if (hasMeat) tags.push('meat-focused');
  
  const hasNoAnimalProducts = !recipe.ingredients.some(i => 
    ['chicken', 'beef', 'pork', 'fish', 'egg', 'milk', 'cheese', 'yogurt'].some(a => 
      i.name.toLowerCase().includes(a)
    )
  );
  if (hasNoAnimalProducts) tags.push('vegan');
  
  return tags;
}

export function transformRecipe(sourceRecipe: SourceRecipe) {
  const ingredients = sourceRecipe.ingredients.map((ing, idx) => {
    const priceInfo = getIngredientPrice(ing.name, ing.quantity_g);
    
    return {
      id: `${sourceRecipe.id}-ing-${idx}`,
      name: ing.name,
      amount: ing.quantity_g,
      unit: 'g',
      price: priceInfo.price,
      category: priceInfo.category
    };
  });
  
  const mealType = sourceRecipe.meal_type === 'breakfast' ? 'breakfast' : 
                   sourceRecipe.meal_type === 'lunch' ? 'lunch' : 'dinner';
  
  return {
    id: sourceRecipe.id,
    name: sourceRecipe.title,
    description: `${sourceRecipe.cuisine} ${sourceRecipe.diet} ${mealType}`,
    image: recipeImages[mealType] || recipeImages['dinner'],
    cookTime: sourceRecipe.cook_time_min + sourceRecipe.prep_time_min,
    servings: 2,
    difficulty: getDifficulty(sourceRecipe.cook_time_min + sourceRecipe.prep_time_min),
    cuisine: sourceRecipe.cuisine,
    mealType: mealType as 'breakfast' | 'lunch' | 'dinner',
    ingredients,
    instructions: generateInstructions(sourceRecipe.title, sourceRecipe.ingredients),
    nutrition: {
      calories: Math.round(sourceRecipe.calories),
      protein: Math.round(sourceRecipe.protein_g),
      carbs: Math.round(sourceRecipe.carbs_g),
      fat: Math.round(sourceRecipe.fat_g)
    },
    tags: getTags(sourceRecipe)
  };
}

export async function fetchAndTransformRecipes() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/Justus1357/RECIPES/main/recipes_1000.json');
    const sourceRecipes: SourceRecipe[] = await response.json();
    
    console.log(`Fetched ${sourceRecipes.length} recipes from GitHub`);
    
    const transformedRecipes = sourceRecipes.map(transformRecipe);
    
    console.log(`Transformed ${transformedRecipes.length} recipes`);
    
    return transformedRecipes;
  } catch (error) {
    console.error('Error fetching/transforming recipes:', error);
    throw error;
  }
}
