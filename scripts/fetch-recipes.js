const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/Justus1357/RECIPES/main/recipes_1000.json';

console.log('Fetching recipes from GitHub...');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const recipes = JSON.parse(data);
      console.log(`Successfully fetched ${recipes.length} recipes`);
      
      const outputPath = path.join(__dirname, '..', 'data', 'source-recipes.json');
      fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));
      console.log(`Saved to ${outputPath}`);
      
      console.log('\nSample recipe:');
      console.log(JSON.stringify(recipes[0], null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}).on('error', (error) => {
  console.error('Error fetching recipes:', error);
});
