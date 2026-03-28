export type UnitSystem = 'metric' | 'imperial';

export interface ConversionResult {
  amount: number;
  unit: string;
}

export const convertWeight = (grams: number, targetSystem: UnitSystem): ConversionResult => {
  if (targetSystem === 'imperial') {
    if (grams >= 453.592) {
      const pounds = grams / 453.592;
      return {
        amount: Math.round(pounds * 100) / 100,
        unit: 'lb'
      };
    }
    const ounces = grams / 28.3495;
    return {
      amount: Math.round(ounces * 10) / 10,
      unit: 'oz'
    };
  }
  return { amount: Math.round(grams), unit: 'g' };
};

export const convertVolume = (ml: number, targetSystem: UnitSystem): ConversionResult => {
  if (targetSystem === 'imperial') {
    if (ml >= 946.353) {
      const quarts = ml / 946.353;
      return {
        amount: Math.round(quarts * 100) / 100,
        unit: 'qt'
      };
    }
    if (ml >= 236.588) {
      const cups = ml / 236.588;
      return {
        amount: Math.round(cups * 100) / 100,
        unit: 'cup'
      };
    }
    if (ml >= 14.7868) {
      const tablespoons = ml / 14.7868;
      return {
        amount: Math.round(tablespoons * 10) / 10,
        unit: 'tbsp'
      };
    }
    const teaspoons = ml / 4.92892;
    return {
      amount: Math.round(teaspoons * 10) / 10,
      unit: 'tsp'
    };
  }
  
  if (ml >= 1000) {
    return {
      amount: Math.round((ml / 1000) * 100) / 100,
      unit: 'L'
    };
  }
  return { amount: Math.round(ml), unit: 'ml' };
};

export const convertTemperature = (celsius: number, targetSystem: UnitSystem): ConversionResult => {
  if (targetSystem === 'imperial') {
    const fahrenheit = (celsius * 9/5) + 32;
    return {
      amount: Math.round(fahrenheit),
      unit: '°F'
    };
  }
  return { amount: Math.round(celsius), unit: '°C' };
};

export const detectUnitType = (unit: string): 'weight' | 'volume' | 'temperature' | 'count' | 'other' => {
  const lowerUnit = unit.toLowerCase();
  
  if (['g', 'kg', 'oz', 'lb', 'gram', 'grams', 'kilogram', 'kilograms', 'ounce', 'ounces', 'pound', 'pounds'].includes(lowerUnit)) {
    return 'weight';
  }
  
  if (['ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'qt', 'quart', 'quarts', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'milliliter', 'milliliters', 'liter', 'liters'].includes(lowerUnit)) {
    return 'volume';
  }
  
  if (['°c', '°f', 'celsius', 'fahrenheit', 'c', 'f'].includes(lowerUnit)) {
    return 'temperature';
  }
  
  if (['pcs', 'piece', 'pieces', 'item', 'items', 'whole', 'clove', 'cloves', 'slice', 'slices'].includes(lowerUnit)) {
    return 'count';
  }
  
  return 'other';
};

export const convertIngredientAmount = (
  amount: number,
  unit: string,
  targetSystem: UnitSystem
): ConversionResult => {
  const unitType = detectUnitType(unit);
  
  switch (unitType) {
    case 'weight':
      const gramsAmount = normalizeToGrams(amount, unit);
      return convertWeight(gramsAmount, targetSystem);
      
    case 'volume':
      const mlAmount = normalizeToMl(amount, unit);
      return convertVolume(mlAmount, targetSystem);
      
    case 'temperature':
      const celsiusAmount = normalizeToCelsius(amount, unit);
      return convertTemperature(celsiusAmount, targetSystem);
      
    case 'count':
    case 'other':
    default:
      return { amount, unit };
  }
};

const normalizeToGrams = (amount: number, unit: string): number => {
  const lowerUnit = unit.toLowerCase();
  
  if (['kg', 'kilogram', 'kilograms'].includes(lowerUnit)) {
    return amount * 1000;
  }
  if (['oz', 'ounce', 'ounces'].includes(lowerUnit)) {
    return amount * 28.3495;
  }
  if (['lb', 'pound', 'pounds'].includes(lowerUnit)) {
    return amount * 453.592;
  }
  
  return amount;
};

const normalizeToMl = (amount: number, unit: string): number => {
  const lowerUnit = unit.toLowerCase();
  
  if (['l', 'liter', 'liters'].includes(lowerUnit)) {
    return amount * 1000;
  }
  if (['cup', 'cups'].includes(lowerUnit)) {
    return amount * 236.588;
  }
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(lowerUnit)) {
    return amount * 14.7868;
  }
  if (['tsp', 'teaspoon', 'teaspoons'].includes(lowerUnit)) {
    return amount * 4.92892;
  }
  if (['qt', 'quart', 'quarts'].includes(lowerUnit)) {
    return amount * 946.353;
  }
  
  return amount;
};

const normalizeToCelsius = (amount: number, unit: string): number => {
  const lowerUnit = unit.toLowerCase();
  
  if (['°f', 'f', 'fahrenheit'].includes(lowerUnit)) {
    return (amount - 32) * 5/9;
  }
  
  return amount;
};

export const formatAmount = (amount: number): string => {
  if (amount === Math.floor(amount)) {
    return amount.toString();
  }
  
  if (amount < 1) {
    const fraction = convertToFraction(amount);
    if (fraction) return fraction;
  }
  
  if (amount % 0.5 === 0) {
    return amount.toFixed(1);
  }
  
  if (amount % 0.25 === 0) {
    return amount.toFixed(2);
  }
  
  return Math.round(amount * 10) / 10 + '';
};

const convertToFraction = (decimal: number): string | null => {
  const fractions: Record<string, string> = {
    '0.25': '¼',
    '0.33': '⅓',
    '0.5': '½',
    '0.67': '⅔',
    '0.75': '¾'
  };
  
  const rounded = Math.round(decimal * 100) / 100;
  return fractions[rounded.toFixed(2)] || null;
};
