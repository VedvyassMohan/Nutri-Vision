import fs from 'fs';
import path from 'path';

const datasetDir = path.join(process.cwd(), 'FINAL FOOD DATASET');
const outputDir = path.join(process.cwd(), 'src', 'data');
const outputFile = path.join(outputDir, 'foodDataset.json');

const files = [
  'FOOD-DATA-GROUP1.csv',
  'FOOD-DATA-GROUP2.csv',
  'FOOD-DATA-GROUP3.csv',
  'FOOD-DATA-GROUP4.csv',
  'FOOD-DATA-GROUP5.csv'
];

function getEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('cheese') || n.includes('butter')) return '🧀';
  if (n.includes('chicken') || n.includes('turkey') || n.includes('poultry')) return '🍗';
  if (n.includes('beef') || n.includes('steak') || n.includes('meat') || n.includes('pork') || n.includes('ham') || n.includes('bacon')) return '🥩';
  if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('shrimp') || n.includes('crab') || n.includes('seafood')) return '🐟';
  if (n.includes('salad') || n.includes('veggie') || n.includes('spinach') || n.includes('broccoli') || n.includes('cabbage')) return '🥗';
  if (n.includes('rice') || n.includes('grain') || n.includes('quinoa') || n.includes('oat') || n.includes('cereal') || n.includes('porridge')) return '🥣';
  if (n.includes('bread') || n.includes('sandwich') || n.includes('toast') || n.includes('bagel') || n.includes('burger') || n.includes('bun')) return '🥪';
  if (n.includes('apple') || n.includes('fruit') || n.includes('berry') || n.includes('banana') || n.includes('orange') || n.includes('grape')) return '🍎';
  if (n.includes('egg') || n.includes('omelet')) return '🍳';
  if (n.includes('soup') || n.includes('broth') || n.includes('stew')) return '🍲';
  if (n.includes('pasta') || n.includes('noodle') || n.includes('spaghetti') || n.includes('macaroni') || n.includes('lasagna')) return '🍝';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('cake') || n.includes('pie') || n.includes('cookie') || n.includes('sweet') || n.includes('chocolate') || n.includes('dessert') || n.includes('ice cream')) return '🍰';
  if (n.includes('milk') || n.includes('shake') || n.includes('smoothie') || n.includes('juice') || n.includes('drink') || n.includes('tea') || n.includes('coffee') || n.includes('beer') || n.includes('wine')) return '🥤';
  if (n.includes('nut') || n.includes('peanut') || n.includes('almond') || n.includes('seed')) return '🥜';
  return '🍽️';
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const foodMap = new Map();

for (const file of files) {
  const filePath = path.join(datasetDir, file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) continue;

  const header = parseCSVLine(lines[0]);
  const foodIdx = header.indexOf('food');
  const calIdx = header.indexOf('Caloric Value');
  const proteinIdx = header.indexOf('Protein');
  const carbsIdx = header.indexOf('Carbohydrates');
  const fatIdx = header.indexOf('Fat');

  if (foodIdx === -1 || calIdx === -1) continue;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const name = row[foodIdx];
    if (!name || name.length < 2) continue;

    const cal = Math.round(parseFloat(row[calIdx]) || 0);
    const protein = parseFloat((parseFloat(row[proteinIdx]) || 0).toFixed(1));
    const carbs = parseFloat((parseFloat(row[carbsIdx]) || 0).toFixed(1));
    const fat = parseFloat((parseFloat(row[fatIdx]) || 0).toFixed(1));

    if (!foodMap.has(name.toLowerCase())) {
      foodMap.set(name.toLowerCase(), {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        cal,
        protein,
        carbs,
        fat,
        emoji: getEmoji(name)
      });
    }
  }
}

const foods = Array.from(foodMap.values()).sort((a, b) => a.name.localeCompare(b.name));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(foods, null, 2), 'utf-8');
console.log(`Successfully parsed ${foods.length} food items into ${outputFile}`);
