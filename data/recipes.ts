import { Recipe } from '@/types/meal';
import { getIngredientPrice } from './ingredient-prices';

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

const veganKeywords = ['vegan', 'plant-based', 'tofu', 'tempeh', 'seitan', 'chickpea', 'lentil', 'bean'];
const vegetarianKeywords = ['vegetarian', 'veggie', 'vegetable'];

const mealImageMap: Record<string, string> = {
  'grilled chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'chicken breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  'chicken thighs': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
  'chicken wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80',
  'chicken drumsticks': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
  'roasted chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'fried chicken': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
  'chicken parmesan': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80',
  'chicken marsala': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'chicken piccata': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  'chicken tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
  'chicken teriyaki': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
  'chicken alfredo': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&q=80',
  'chicken cacciatore': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'chicken schnitzel': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80',
  'chicken katsu': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  'chicken satay': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'chicken souvlaki': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'chicken gyros': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'chicken enchiladas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'chicken quesadilla': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&q=80',
  'chicken burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'chicken taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'chicken fajitas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'chicken noodle': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chicken soup': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
  'chicken salad': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'chicken sandwich': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
  'chicken wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'chicken bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'chicken curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'chicken fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'chicken stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'chicken pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  'chicken lo mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chicken chow mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chicken pho': 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&q=80',
  'chicken ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chicken udon': 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80',
  'chicken soba': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chicken pesto': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'chicken carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'chicken lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
  'chicken casserole': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'chicken pot pie': 'https://images.unsplash.com/photo-1619895092538-128341789043?w=800&q=80',
  'chicken nuggets': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
  'chicken tenders': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
  'chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'beef steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'ribeye': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'sirloin': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'filet mignon': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  't-bone': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'beef tenderloin': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'beef wellington': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'beef stroganoff': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'beef bourguignon': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'beef stew': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'beef chili': 'https://images.unsplash.com/photo-1583224964811-e9151cb5e4f1?w=800&q=80',
  'beef tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'beef burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'beef enchiladas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'beef fajitas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'beef quesadilla': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&q=80',
  'beef nachos': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80',
  'beef burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'beef meatballs': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'beef meatloaf': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'beef kebab': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'beef skewers': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'beef stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'beef broccoli': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'beef lo mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'beef chow mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'beef pho': 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&q=80',
  'beef ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'beef curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'beef rendang': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'beef lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
  'beef bolognese': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'beef ragu': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'beef carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'beef sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'beef wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'beef bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'beef salad': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'beef': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'salmon fillet': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'grilled salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'baked salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'pan seared salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'salmon teriyaki': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'salmon poke': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'salmon sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'salmon sashimi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'salmon roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'salmon bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'salmon salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'salmon pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'salmon burger': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
  'salmon patties': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'salmon cakes': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'tuna steak': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'grilled tuna': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'seared tuna': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'tuna poke': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'tuna sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'tuna sashimi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'tuna roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'tuna salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'tuna sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'tuna melt': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'tuna casserole': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'tuna pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'tuna bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'tuna': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'cod fillet': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'baked cod': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'grilled cod': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'fish and chips': 'https://images.unsplash.com/photo-1579208570378-8c970854bc23?w=800&q=80',
  'fish tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'fish fillet': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'fish curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'fish stew': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'fish soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'fish sandwich': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
  'fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'shrimp scampi': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'shrimp pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'shrimp stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'shrimp tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'shrimp cocktail': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'shrimp tempura': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'shrimp fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'shrimp curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'shrimp pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  'shrimp lo mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'shrimp bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'shrimp salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'shrimp': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'crab cakes': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'crab legs': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'lobster roll': 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',
  'lobster tail': 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',
  'scallops': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&q=80',
  'mussels': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'clams': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'oysters': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'seafood paella': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80',
  'seafood pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'seafood platter': 'https://images.unsplash.com/photo-1626074353765-517a65edd5c0?w=800&q=80',
  'pork chops': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork tenderloin': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork ribs': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'pulled pork': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork roast': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork belly': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork schnitzel': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork katsu': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'pork stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'pork fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'pork lo mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'pork tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'pork carnitas': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'pork burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'pork': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'lamb chops': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'lamb shank': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'lamb curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'lamb kebab': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'lamb gyro': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'lamb stew': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'lamb': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'turkey breast': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=800&q=80',
  'roasted turkey': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=800&q=80',
  'turkey sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'turkey burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'turkey meatballs': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'turkey': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=800&q=80',
  'duck breast': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'duck confit': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'peking duck': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'duck': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'spaghetti bolognese': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'spaghetti carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'spaghetti aglio': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'spaghetti marinara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'spaghetti meatballs': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'spaghetti': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
  'fettuccine alfredo': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&q=80',
  'fettuccine': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&q=80',
  'penne arrabbiata': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'penne vodka': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'penne': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'linguine': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'rigatoni': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'pappardelle': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'tagliatelle': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'ravioli': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=800&q=80',
  'tortellini': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=800&q=80',
  'gnocchi': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=800&q=80',
  'macaroni cheese': 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&q=80',
  'mac and cheese': 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&q=80',
  'pasta primavera': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'pasta pesto': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
  'cannelloni': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
  'manicotti': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
  'white rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
  'brown rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
  'fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'rice pilaf': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
  'rice bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
  'risotto': 'https://images.unsplash.com/photo-1476124369491-f01e80c2a82d?w=800&q=80',
  'paella': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'quinoa bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'quinoa salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'quinoa': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'couscous': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'bulgur': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'farro': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'barley': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'caesar salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
  'greek salad': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'cobb salad': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'caprese salad': 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&q=80',
  'garden salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'spinach salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'kale salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'arugula salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'waldorf salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'nicoise salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'tomato soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'vegetable soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'minestrone': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'french onion soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'clam chowder': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'butternut squash soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'lentil soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'split pea soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'miso soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'wonton soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'vegetable stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'tofu stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'thai curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'indian curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'green curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'red curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'yellow curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'massaman curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'panang curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'burrito bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'enchiladas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'quesadilla': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&q=80',
  'nachos': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80',
  'fajitas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'tostadas': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'tamales': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'cheeseburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'hamburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'veggie burger': 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80',
  'margherita pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'pepperoni pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'club sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'blt sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'grilled cheese': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'reuben sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'philly cheesesteak': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'panini': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'sub sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'hoagie': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'poke bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'buddha bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'grain bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'tofu scramble': 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&q=80',
  'tofu bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'tofu': 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&q=80',
  'tempeh': 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&q=80',
  'seitan': 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&q=80',
  'roasted vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'grilled vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'vegetable': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  'pad see ew': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'drunken noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'lo mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'chow mein': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'dan dan noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'singapore noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'udon': 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80',
  'soba': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'pho': 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&q=80',
  'sushi roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'sashimi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'nigiri': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'maki': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'california roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'spicy tuna roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'dragon roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'rainbow roll': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'casserole': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'meatballs': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'meatloaf': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'kebab': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'skewer': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
  'chili': 'https://images.unsplash.com/photo-1583224964811-e9151cb5e4f1?w=800&q=80',
  'stew': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'pot roast': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'braised': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
  'roasted': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'grilled': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'baked': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  'fried': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
  'sauteed': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'steamed': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'vegan tray': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'vegan bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'vegan burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'vegan tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'vegan enchiladas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'vegan quesadilla': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&q=80',
  'vegan fajitas': 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
  'vegan curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'vegan stir fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'vegan pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  'vegan pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'vegan sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  'vegan wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'vegan salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'vegan soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'vegan rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
  'vegan noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'plant-based': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'chickpea': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'lentil': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'bean burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'bean taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'black bean': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'veggie wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
  'veggie bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'veggie tray': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'vegetable tray': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'vegetable bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'vegetable curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'mushroom': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&q=80',
  'portobello': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&q=80',
};

const defaultMealImages: Record<string, string> = {
  'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  'lunch': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'dinner': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
};

function getImageForRecipe(recipeName: string, mealType: string, diet: string): string {
  const lowerName = recipeName.toLowerCase();
  
  const isVegan = diet === 'vegan' || veganKeywords.some(kw => lowerName.includes(kw));
  const isVegetarian = diet === 'vegetarian' || vegetarianKeywords.some(kw => lowerName.includes(kw));
  
  if (isVegan) {
    if (lowerName.includes('tray')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    if (lowerName.includes('bowl')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    if (lowerName.includes('burrito')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80';
    if (lowerName.includes('taco')) return 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80';
    if (lowerName.includes('curry')) return 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80';
    if (lowerName.includes('stir fry')) return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80';
    if (lowerName.includes('pasta')) return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80';
    if (lowerName.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    if (lowerName.includes('soup')) return 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&q=80';
    if (lowerName.includes('sandwich')) return 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80';
    if (lowerName.includes('wrap')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80';
    if (lowerName.includes('pizza')) return 'https://images.unsplash.com/photo-1571407970349-bc81e7e96a47?w=800&q=80';
    if (lowerName.includes('burger')) return 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80';
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
  }
  
  if (isVegetarian) {
    if (lowerName.includes('tray')) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
    if (lowerName.includes('bowl')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
    if (lowerName.includes('pasta')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80';
    if (lowerName.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    if (lowerName.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';
    if (lowerName.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80';
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
  }
  
  for (const [key, imageUrl] of Object.entries(mealImageMap)) {
    if (lowerName.includes(key)) {
      return imageUrl;
    }
  }
  
  return defaultMealImages[mealType] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
}

function generateInstructions(recipeName: string, ingredients: SourceIngredient[]): string[] {
  const hasProtein = ingredients.some(i => 
    i.name.toLowerCase().includes('chicken') || 
    i.name.toLowerCase().includes('beef') ||
    i.name.toLowerCase().includes('fish') ||
    i.name.toLowerCase().includes('salmon') ||
    i.name.toLowerCase().includes('egg') ||
    i.name.toLowerCase().includes('tofu')
  );
  
  const hasVegetables = ingredients.some(i => 
    i.name.toLowerCase().includes('broccoli') || 
    i.name.toLowerCase().includes('zucchini') ||
    i.name.toLowerCase().includes('pepper') ||
    i.name.toLowerCase().includes('tomato') ||
    i.name.toLowerCase().includes('spinach') ||
    i.name.toLowerCase().includes('kale') ||
    i.name.toLowerCase().includes('carrot')
  );
  
  const hasGrains = ingredients.some(i => 
    i.name.toLowerCase().includes('rice') || 
    i.name.toLowerCase().includes('pasta') ||
    i.name.toLowerCase().includes('quinoa') ||
    i.name.toLowerCase().includes('oats')
  );
  
  const instructions: string[] = [];
  
  instructions.push('Gather and prepare all ingredients, wash vegetables');
  
  if (hasGrains) {
    instructions.push('Cook grains according to package instructions');
  }
  
  if (hasProtein) {
    instructions.push('Season and cook protein until done (165°F for poultry, 145°F for fish)');
  }
  
  if (hasVegetables) {
    instructions.push('Sauté or steam vegetables until tender-crisp');
  }
  
  instructions.push('Combine all ingredients, season with salt and pepper to taste');
  instructions.push('Plate and serve hot, garnish as desired');
  
  return instructions;
}

function getDifficulty(cookTime: number): 'Easy' | 'Medium' | 'Hard' {
  if (cookTime <= 25) return 'Easy';
  if (cookTime <= 45) return 'Medium';
  return 'Hard';
}

function getTags(recipe: SourceRecipe): string[] {
  const tags: string[] = [];
  
  tags.push(recipe.meal_type);
  
  if (recipe.diet !== 'any') {
    tags.push(recipe.diet);
  }
  
  if (recipe.protein_g > 25) tags.push('high-protein');
  if (recipe.calories < 300) tags.push('low-calorie');
  if (recipe.carbs_g < 20) tags.push('low-carb');
  if (recipe.cook_time_min + recipe.prep_time_min <= 20) tags.push('quick');
  
  const hasVegetables = recipe.ingredients.some(i => 
    ['broccoli', 'zucchini', 'spinach', 'kale', 'pepper', 'tomato', 'carrot', 'cucumber'].some(v => 
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
  
  const hasFish = recipe.ingredients.some(i => 
    ['salmon', 'tuna', 'cod', 'fish', 'shrimp'].some(f => 
      i.name.toLowerCase().includes(f)
    )
  );
  if (hasFish) tags.push('seafood');
  
  const hasNoAnimalProducts = !recipe.ingredients.some(i => 
    ['chicken', 'beef', 'pork', 'fish', 'egg', 'milk', 'cheese', 'yogurt', 'salmon', 'tuna', 'shrimp'].some(a => 
      i.name.toLowerCase().includes(a)
    )
  );
  if (hasNoAnimalProducts) {
    tags.push('vegan');
    tags.push('vegetarian');
  } else {
    const hasNoMeat = !recipe.ingredients.some(i => 
      ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'lamb', 'turkey', 'shrimp'].some(m => 
        i.name.toLowerCase().includes(m)
      )
    );
    if (hasNoMeat) tags.push('vegetarian');
  }
  
  return tags;
}

function transformRecipe(sourceRecipe: SourceRecipe): Recipe {
  const ingredients = sourceRecipe.ingredients.map((ing, idx) => {
    const priceInfo = getIngredientPrice(ing.name, ing.quantity_g);
    
    return {
      id: `${sourceRecipe.id}-ing-${idx}`,
      name: ing.name,
      amount: ing.quantity_g,
      unit: priceInfo.unit,
      price: priceInfo.price,
      category: priceInfo.category,
      packageSize: priceInfo.packageSize,
      pricePerPackage: priceInfo.pricePerPackage
    };
  });
  
  const mealType = sourceRecipe.meal_type === 'breakfast' ? 'breakfast' : 
                   sourceRecipe.meal_type === 'lunch' ? 'lunch' : 'dinner';
  
  return {
    id: sourceRecipe.id,
    name: sourceRecipe.title,
    description: `${sourceRecipe.cuisine} ${sourceRecipe.diet} ${mealType}`,
    image: getImageForRecipe(sourceRecipe.title, mealType, sourceRecipe.diet),
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

const simpleBreakfasts: Recipe[] = [
  {
    id: 'bf-001',
    name: 'Toast with Butter',
    description: 'Simple buttered toast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-001-1', name: 'Bread', amount: 100, unit: 'g', price: 0.30, category: 'Bakery', packageSize: 500, pricePerPackage: 1.50 },
      { id: 'bf-001-2', name: 'Butter', amount: 20, unit: 'g', price: 0.10, category: 'Dairy', packageSize: 250, pricePerPackage: 1.20 }
    ],
    instructions: ['Toast bread', 'Spread butter', 'Serve immediately'],
    nutrition: { calories: 250, protein: 6, carbs: 30, fat: 10 },
    tags: ['breakfast', 'quick', 'easy']
  },
  {
    id: 'bf-002',
    name: 'Yogurt with Honey',
    description: 'Greek yogurt with honey drizzle',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-002-1', name: 'Greek Yogurt', amount: 200, unit: 'g', price: 0.80, category: 'Dairy', packageSize: 500, pricePerPackage: 2.00 },
      { id: 'bf-002-2', name: 'Honey', amount: 20, unit: 'g', price: 0.15, category: 'Pantry', packageSize: 350, pricePerPackage: 2.50 }
    ],
    instructions: ['Pour yogurt into bowl', 'Drizzle honey on top', 'Enjoy'],
    nutrition: { calories: 200, protein: 15, carbs: 25, fat: 5 },
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian']
  },
  {
    id: 'bf-003',
    name: 'Cereal with Milk',
    description: 'Classic breakfast cereal',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-003-1', name: 'Cereal', amount: 50, unit: 'g', price: 0.35, category: 'Pantry', packageSize: 500, pricePerPackage: 3.50 },
      { id: 'bf-003-2', name: 'Milk', amount: 200, unit: 'ml', price: 0.20, category: 'Dairy', packageSize: 1000, pricePerPackage: 1.00 }
    ],
    instructions: ['Pour cereal into bowl', 'Add milk', 'Serve immediately'],
    nutrition: { calories: 220, protein: 8, carbs: 35, fat: 5 },
    tags: ['breakfast', 'quick', 'easy', 'vegetarian']
  },
  {
    id: 'bf-004',
    name: 'Banana with Peanut Butter',
    description: 'Sliced banana with peanut butter',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-004-1', name: 'Banana', amount: 120, unit: 'g', price: 0.25, category: 'Produce', packageSize: 1000, pricePerPackage: 2.00 },
      { id: 'bf-004-2', name: 'Peanut Butter', amount: 30, unit: 'g', price: 0.25, category: 'Pantry', packageSize: 350, pricePerPackage: 3.00 }
    ],
    instructions: ['Slice banana', 'Spread peanut butter on slices', 'Enjoy'],
    nutrition: { calories: 280, protein: 8, carbs: 30, fat: 14 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-005',
    name: 'Oatmeal',
    description: 'Quick oats with water',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80',
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-005-1', name: 'Oats', amount: 50, unit: 'g', price: 0.15, category: 'Pantry', packageSize: 500, pricePerPackage: 1.50 },
      { id: 'bf-005-2', name: 'Water', amount: 200, unit: 'ml', price: 0.00, category: 'Pantry', packageSize: 1000, pricePerPackage: 0.00 }
    ],
    instructions: ['Boil water', 'Add oats', 'Stir and let sit for 3 minutes', 'Serve'],
    nutrition: { calories: 190, protein: 7, carbs: 32, fat: 3 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-006',
    name: 'Scrambled Eggs',
    description: 'Quick scrambled eggs',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-006-1', name: 'Eggs', amount: 100, unit: 'g', price: 0.40, category: 'Dairy', packageSize: 600, pricePerPackage: 2.40 },
      { id: 'bf-006-2', name: 'Butter', amount: 10, unit: 'g', price: 0.05, category: 'Dairy', packageSize: 250, pricePerPackage: 1.20 }
    ],
    instructions: ['Beat eggs', 'Melt butter in pan', 'Cook eggs stirring constantly', 'Serve hot'],
    nutrition: { calories: 200, protein: 13, carbs: 2, fat: 15 },
    tags: ['breakfast', 'quick', 'high-protein', 'vegetarian']
  },
  {
    id: 'bf-007',
    name: 'Toast with Jam',
    description: 'Toast with fruit jam',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-007-1', name: 'Bread', amount: 100, unit: 'g', price: 0.30, category: 'Bakery', packageSize: 500, pricePerPackage: 1.50 },
      { id: 'bf-007-2', name: 'Jam', amount: 30, unit: 'g', price: 0.20, category: 'Pantry', packageSize: 450, pricePerPackage: 3.00 }
    ],
    instructions: ['Toast bread', 'Spread jam', 'Serve'],
    nutrition: { calories: 240, protein: 5, carbs: 45, fat: 3 },
    tags: ['breakfast', 'quick', 'easy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-008',
    name: 'Cottage Cheese Bowl',
    description: 'Simple cottage cheese',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-008-1', name: 'Cottage Cheese', amount: 200, unit: 'g', price: 0.70, category: 'Dairy', packageSize: 500, pricePerPackage: 1.75 }
    ],
    instructions: ['Scoop cottage cheese into bowl', 'Serve'],
    nutrition: { calories: 180, protein: 20, carbs: 8, fat: 8 },
    tags: ['breakfast', 'quick', 'high-protein', 'vegetarian']
  },
  {
    id: 'bf-009',
    name: 'Apple Slices',
    description: 'Fresh sliced apple',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-009-1', name: 'Apple', amount: 150, unit: 'g', price: 0.30, category: 'Produce', packageSize: 1000, pricePerPackage: 2.00 }
    ],
    instructions: ['Wash apple', 'Slice into pieces', 'Serve'],
    nutrition: { calories: 80, protein: 0, carbs: 21, fat: 0 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian', 'low-calorie']
  },
  {
    id: 'bf-010',
    name: 'Granola with Yogurt',
    description: 'Crunchy granola with yogurt',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-010-1', name: 'Granola', amount: 50, unit: 'g', price: 0.40, category: 'Pantry', packageSize: 500, pricePerPackage: 4.00 },
      { id: 'bf-010-2', name: 'Greek Yogurt', amount: 150, unit: 'g', price: 0.60, category: 'Dairy', packageSize: 500, pricePerPackage: 2.00 }
    ],
    instructions: ['Pour yogurt into bowl', 'Top with granola', 'Enjoy'],
    nutrition: { calories: 280, protein: 12, carbs: 35, fat: 10 },
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian']
  },
  {
    id: 'bf-011',
    name: 'Cheese Sandwich',
    description: 'Simple cheese sandwich',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-011-1', name: 'Bread', amount: 100, unit: 'g', price: 0.30, category: 'Bakery', packageSize: 500, pricePerPackage: 1.50 },
      { id: 'bf-011-2', name: 'Cheese', amount: 50, unit: 'g', price: 0.40, category: 'Dairy', packageSize: 400, pricePerPackage: 3.20 }
    ],
    instructions: ['Place cheese between bread slices', 'Serve'],
    nutrition: { calories: 320, protein: 15, carbs: 30, fat: 15 },
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: 'bf-012',
    name: 'Smoothie Bowl Base',
    description: 'Banana and milk smoothie',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-012-1', name: 'Banana', amount: 120, unit: 'g', price: 0.25, category: 'Produce', packageSize: 1000, pricePerPackage: 2.00 },
      { id: 'bf-012-2', name: 'Milk', amount: 200, unit: 'ml', price: 0.20, category: 'Dairy', packageSize: 1000, pricePerPackage: 1.00 }
    ],
    instructions: ['Blend banana and milk until smooth', 'Pour into bowl', 'Serve'],
    nutrition: { calories: 200, protein: 7, carbs: 35, fat: 4 },
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian']
  },
  {
    id: 'bf-013',
    name: 'Hard Boiled Eggs',
    description: 'Simple boiled eggs',
    image: 'https://images.unsplash.com/photo-1587486937736-e7c6b76584a8?w=800&q=80',
    cookTime: 10,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-013-1', name: 'Eggs', amount: 100, unit: 'g', price: 0.40, category: 'Dairy', packageSize: 600, pricePerPackage: 2.40 }
    ],
    instructions: ['Boil water', 'Add eggs', 'Cook for 8 minutes', 'Cool in cold water', 'Peel and serve'],
    nutrition: { calories: 140, protein: 12, carbs: 1, fat: 10 },
    tags: ['breakfast', 'quick', 'high-protein', 'vegetarian']
  },
  {
    id: 'bf-014',
    name: 'Crackers with Cheese',
    description: 'Crackers topped with cheese',
    image: 'https://images.unsplash.com/photo-1452251889946-8ff5ea7f27f8?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-014-1', name: 'Crackers', amount: 50, unit: 'g', price: 0.35, category: 'Pantry', packageSize: 250, pricePerPackage: 1.75 },
      { id: 'bf-014-2', name: 'Cheese', amount: 40, unit: 'g', price: 0.32, category: 'Dairy', packageSize: 400, pricePerPackage: 3.20 }
    ],
    instructions: ['Place cheese on crackers', 'Serve'],
    nutrition: { calories: 260, protein: 10, carbs: 20, fat: 15 },
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: 'bf-015',
    name: 'Fruit Salad',
    description: 'Mixed fresh fruits',
    image: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=800&q=80',
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-015-1', name: 'Apple', amount: 100, unit: 'g', price: 0.20, category: 'Produce', packageSize: 1000, pricePerPackage: 2.00 },
      { id: 'bf-015-2', name: 'Banana', amount: 100, unit: 'g', price: 0.20, category: 'Produce', packageSize: 1000, pricePerPackage: 2.00 },
      { id: 'bf-015-3', name: 'Orange', amount: 100, unit: 'g', price: 0.25, category: 'Produce', packageSize: 1000, pricePerPackage: 2.50 }
    ],
    instructions: ['Wash and chop all fruits', 'Mix in bowl', 'Serve fresh'],
    nutrition: { calories: 150, protein: 2, carbs: 38, fat: 0 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-016',
    name: 'Bagel with Cream Cheese',
    description: 'Toasted bagel with cream cheese',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    cookTime: 4,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-016-1', name: 'Bagel', amount: 100, unit: 'g', price: 0.60, category: 'Bakery', packageSize: 400, pricePerPackage: 2.40 },
      { id: 'bf-016-2', name: 'Cream Cheese', amount: 30, unit: 'g', price: 0.25, category: 'Dairy', packageSize: 200, pricePerPackage: 1.60 }
    ],
    instructions: ['Toast bagel', 'Spread cream cheese', 'Serve'],
    nutrition: { calories: 300, protein: 10, carbs: 45, fat: 10 },
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: 'bf-017',
    name: 'Muesli with Milk',
    description: 'Muesli cereal with cold milk',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-017-1', name: 'Muesli', amount: 60, unit: 'g', price: 0.40, category: 'Pantry', packageSize: 500, pricePerPackage: 3.30 },
      { id: 'bf-017-2', name: 'Milk', amount: 200, unit: 'ml', price: 0.20, category: 'Dairy', packageSize: 1000, pricePerPackage: 1.00 }
    ],
    instructions: ['Pour muesli into bowl', 'Add milk', 'Serve'],
    nutrition: { calories: 280, protein: 10, carbs: 45, fat: 7 },
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian']
  },
  {
    id: 'bf-018',
    name: 'Rice Cakes with Almond Butter',
    description: 'Rice cakes topped with almond butter',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-018-1', name: 'Rice Cakes', amount: 30, unit: 'g', price: 0.30, category: 'Pantry', packageSize: 200, pricePerPackage: 2.00 },
      { id: 'bf-018-2', name: 'Almond Butter', amount: 30, unit: 'g', price: 0.35, category: 'Pantry', packageSize: 350, pricePerPackage: 4.00 }
    ],
    instructions: ['Spread almond butter on rice cakes', 'Serve'],
    nutrition: { calories: 220, protein: 6, carbs: 18, fat: 14 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-019',
    name: 'Protein Shake',
    description: 'Protein powder with milk',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-019-1', name: 'Protein Powder', amount: 30, unit: 'g', price: 0.80, category: 'Pantry', packageSize: 900, pricePerPackage: 24.00 },
      { id: 'bf-019-2', name: 'Milk', amount: 300, unit: 'ml', price: 0.30, category: 'Dairy', packageSize: 1000, pricePerPackage: 1.00 }
    ],
    instructions: ['Add protein powder to shaker', 'Add milk', 'Shake well', 'Serve'],
    nutrition: { calories: 250, protein: 30, carbs: 18, fat: 6 },
    tags: ['breakfast', 'quick', 'high-protein', 'vegetarian']
  },
  {
    id: 'bf-020',
    name: 'English Muffin with Butter',
    description: 'Toasted English muffin with butter',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    cookTime: 4,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-020-1', name: 'English Muffin', amount: 60, unit: 'g', price: 0.40, category: 'Bakery', packageSize: 360, pricePerPackage: 2.40 },
      { id: 'bf-020-2', name: 'Butter', amount: 15, unit: 'g', price: 0.07, category: 'Dairy', packageSize: 250, pricePerPackage: 1.20 }
    ],
    instructions: ['Toast English muffin', 'Spread butter', 'Serve warm'],
    nutrition: { calories: 200, protein: 5, carbs: 28, fat: 8 },
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: 'bf-021',
    name: 'Croissant',
    description: 'Fresh buttery croissant',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    cookTime: 2,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'French',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-021-1', name: 'Croissant', amount: 60, unit: 'g', price: 0.80, category: 'Bakery', packageSize: 240, pricePerPackage: 3.20 }
    ],
    instructions: ['Warm croissant if desired', 'Serve'],
    nutrition: { calories: 230, protein: 5, carbs: 26, fat: 12 },
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: 'bf-022',
    name: 'Avocado Toast',
    description: 'Toast with mashed avocado',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80',
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-022-1', name: 'Bread', amount: 100, unit: 'g', price: 0.30, category: 'Bakery', packageSize: 500, pricePerPackage: 1.50 },
      { id: 'bf-022-2', name: 'Avocado', amount: 100, unit: 'g', price: 0.80, category: 'Produce', packageSize: 200, pricePerPackage: 1.60 }
    ],
    instructions: ['Toast bread', 'Mash avocado', 'Spread on toast', 'Season with salt and pepper'],
    nutrition: { calories: 320, protein: 7, carbs: 32, fat: 18 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-023',
    name: 'Instant Oatmeal Cup',
    description: 'Quick instant oatmeal',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-023-1', name: 'Instant Oatmeal', amount: 40, unit: 'g', price: 0.30, category: 'Pantry', packageSize: 400, pricePerPackage: 3.00 },
      { id: 'bf-023-2', name: 'Water', amount: 180, unit: 'ml', price: 0.00, category: 'Pantry', packageSize: 1000, pricePerPackage: 0.00 }
    ],
    instructions: ['Add hot water to oatmeal', 'Stir', 'Let sit for 2 minutes', 'Serve'],
    nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
    tags: ['breakfast', 'quick', 'easy', 'vegan', 'vegetarian']
  },
  {
    id: 'bf-024',
    name: 'Berries with Cream',
    description: 'Fresh berries with whipped cream',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-024-1', name: 'Mixed Berries', amount: 150, unit: 'g', price: 1.20, category: 'Produce', packageSize: 300, pricePerPackage: 2.40 },
      { id: 'bf-024-2', name: 'Whipped Cream', amount: 30, unit: 'g', price: 0.25, category: 'Dairy', packageSize: 250, pricePerPackage: 2.00 }
    ],
    instructions: ['Wash berries', 'Place in bowl', 'Top with whipped cream', 'Serve'],
    nutrition: { calories: 180, protein: 2, carbs: 22, fat: 10 },
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian']
  },
  {
    id: 'bf-025',
    name: 'Nut Mix',
    description: 'Mixed nuts for quick energy',
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80',
    cookTime: 1,
    servings: 1,
    difficulty: 'Easy',
    cuisine: 'International',
    mealType: 'breakfast',
    ingredients: [
      { id: 'bf-025-1', name: 'Mixed Nuts', amount: 50, unit: 'g', price: 0.60, category: 'Pantry', packageSize: 400, pricePerPackage: 4.80 }
    ],
    instructions: ['Pour nuts into bowl or bag', 'Serve'],
    nutrition: { calories: 290, protein: 10, carbs: 10, fat: 25 },
    tags: ['breakfast', 'quick', 'healthy', 'vegan', 'vegetarian', 'high-protein']
  }
];

let cachedRecipes: Recipe[] | null = null;
let loadPromise: Promise<Recipe[]> | null = null;

async function fetchSourceRecipes(): Promise<SourceRecipe[]> {
  const response = await fetch('https://raw.githubusercontent.com/Justus1357/RECIPES/main/recipes_1000.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.statusText}`);
  }
  return response.json();
}

export async function loadRecipes(): Promise<Recipe[]> {
  if (cachedRecipes) {
    console.log('✅ Using cached recipes:', cachedRecipes.length);
    return cachedRecipes;
  }
  
  if (loadPromise) {
    console.log('⏳ Recipe loading already in progress...');
    return loadPromise;
  }
  
  loadPromise = (async () => {
    try {
      console.log('🔄 Fetching recipes from GitHub...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch('https://raw.githubusercontent.com/Justus1357/RECIPES/main/recipes_1000.json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const sourceRecipes = await response.json();
        console.log(`✅ Fetched ${sourceRecipes.length} recipes, transforming...`);
        
        const transformedRecipes = sourceRecipes.map(transformRecipe);
        cachedRecipes = [...simpleBreakfasts, ...transformedRecipes];
        console.log(`✅ Loaded ${cachedRecipes.length} recipes (${simpleBreakfasts.length} simple + ${transformedRecipes.length} from GitHub)`);
        
        return cachedRecipes;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn('⏱️ Recipe fetch timeout - using simple breakfasts only');
        } else {
          console.error('❌ Recipe fetch failed:', fetchError.message);
        }
        
        cachedRecipes = simpleBreakfasts;
        return simpleBreakfasts;
      }
    } catch (error) {
      console.error('❌ Critical error loading recipes:', error);
      cachedRecipes = simpleBreakfasts;
      return simpleBreakfasts;
    } finally {
      loadPromise = null;
    }
  })();
  
  return loadPromise;
}

export let recipes: Recipe[] = [];

loadRecipes().then(loadedRecipes => {
  recipes = loadedRecipes;
  console.log(`Recipes ready: ${recipes.length} total`);
}).catch(error => {
  console.error('Failed to load recipes:', error);
});
