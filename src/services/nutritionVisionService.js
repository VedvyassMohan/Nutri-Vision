import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import indianVisionModel from '../data/indianFoodVisionModel.json';
import foodDataset from '../data/foodDataset.json';
import foodModelClasses from '../data/foodModelClasses.json';

export const MODEL_ID = 'MobileNetV2 + Trained Indian Food Head';

let mobileNetModel = null;
let headWeights = null;
let initialized = false;

// Map folder names -> display names (folder: adhirasam -> Adhirasam)
function folderToDisplayName(folderName) {
  return folderName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

async function loadHeadWeights() {
  if (headWeights) return headWeights;
  try {
    const response = await fetch('/food_model/head_weights.json');
    const data = await response.json();
    // Pre-convert to TF tensors for fast inference
    headWeights = {
      bn: {
        gamma:    tf.tensor1d(data.batch_normalization.weights[0]),
        beta:     tf.tensor1d(data.batch_normalization.weights[1]),
        mean:     tf.tensor1d(data.batch_normalization.weights[2]),
        variance: tf.tensor1d(data.batch_normalization.weights[3]),
      },
      dense1: {
        kernel: tf.tensor2d(data.dense.weights[0]),
        bias:   tf.tensor1d(data.dense.weights[1]),
      },
      dense2: {
        kernel: tf.tensor2d(data.dense_1.weights[0]),
        bias:   tf.tensor1d(data.dense_1.weights[1]),
      },
      dense3: {
        kernel: tf.tensor2d(data.dense_2.weights[0]),
        bias:   tf.tensor1d(data.dense_2.weights[1]),
      }
    };
    console.log('Head weights loaded successfully');
    return headWeights;
  } catch (err) {
    console.warn('Failed to load head weights:', err);
    return null;
  }
}

async function initModels() {
  if (initialized) return;
  initialized = true;
  try {
    [mobileNetModel, headWeights] = await Promise.all([
      mobilenet.load({ version: 2, alpha: 1.0 }),
      loadHeadWeights()
    ]);
    console.log('Models initialized');
  } catch (e) {
    console.warn('Model init error:', e);
  }
}

function applyBatchNorm(x, bn, epsilon = 1e-3) {
  return tf.tidy(() => {
    const normalized = tf.div(tf.sub(x, bn.mean), tf.sqrt(tf.add(bn.variance, epsilon)));
    return tf.add(tf.mul(bn.gamma, normalized), bn.beta);
  });
}

function applyDense(x, layer, activation = 'relu') {
  return tf.tidy(() => {
    const out = tf.add(tf.matMul(x, layer.kernel), layer.bias);
    return activation === 'relu' ? tf.relu(out) : tf.softmax(out);
  });
}

async function runInference(imgEl) {
  if (!mobileNetModel || !headWeights) return null;

  return tf.tidy(() => {
    // Get MobileNetV2 embedding (1280-dim) via infer()
    const embedding = mobileNetModel.infer(imgEl, true); // shape: [1, 1280]

    // Apply trained classification head
    const normed  = applyBatchNorm(embedding, headWeights.bn);
    const h1      = applyDense(normed, headWeights.dense1, 'relu');
    const h2      = applyDense(h1,    headWeights.dense2, 'relu');
    const logits  = applyDense(h2,    headWeights.dense3, 'softmax');

    const probs     = logits.dataSync();
    const topIdx    = Array.from(probs).reduce((a, b, i) => probs[a] > b ? a : i, 0);
    const topProb   = Math.round(probs[topIdx] * 100);
    const className = foodModelClasses[String(topIdx)] || 'unknown';

    return { className, confidence: topProb };
  });
}

function getFoodData(className) {
  const displayName = folderToDisplayName(className);

  // Try exact match in foodDataset
  let item = foodDataset.find(f =>
    f.name.toLowerCase() === displayName.toLowerCase() ||
    f.name.toLowerCase().replace(/\s+/g, '_') === className.toLowerCase()
  );

  // Try partial match
  if (!item) {
    const words = className.split('_');
    item = foodDataset.find(f =>
      words.some(w => w.length > 3 && f.name.toLowerCase().includes(w))
    );
  }

  // Try matching against indianVisionModel categories
  if (!item) {
    const cat = indianVisionModel.categories.find(c =>
      c.id === className || c.name.toLowerCase() === displayName.toLowerCase()
    );
    if (cat) {
      return {
        name: cat.name,
        cal: cat.cal || 200,
        protein: cat.protein || 5,
        carbs: cat.carbs || 30,
        fat: cat.fat || 5,
        emoji: cat.emoji || '🍛'
      };
    }
  }

  return item || {
    name: displayName,
    cal: 200, protein: 5, carbs: 30, fat: 5, emoji: '🍛'
  };
}

export async function analyzeImageWithModel(imageDataUrl) {
  // Start model init in background if not done yet
  if (!initialized) initModels();

  if (!imageDataUrl) {
    return { isValidFood: false, errorMessage: 'No image provided', foodName: null, modelName: MODEL_ID };
  }

  try {
    // Load the image element
    const imgEl = new Image();
    imgEl.src = imageDataUrl;
    await new Promise((res, rej) => {
      imgEl.onload = res;
      imgEl.onerror = rej;
    });

    // Wait for models to be ready (up to 15s)
    let waited = 0;
    while ((!mobileNetModel || !headWeights) && waited < 15000) {
      await new Promise(r => setTimeout(r, 300));
      waited += 300;
    }

    // Run inference with trained head
    if (mobileNetModel && headWeights) {
      const result = await runInference(imgEl);
      if (result) {
        const foodData = getFoodData(result.className);
        return {
          isValidFood: true,
          foodName: foodData.name,
          cal: foodData.cal,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat,
          emoji: foodData.emoji || '🍛',
          confidence: result.confidence,
          modelName: MODEL_ID,
          source: 'MobileNetV2 + Trained Indian Food Classifier'
        };
      }
    }

    // Fallback: MobileNet classify only
    if (mobileNetModel) {
      const predictions = await mobileNetModel.classify(imgEl);
      const topPred = predictions[0];
      const pText = topPred?.className?.toLowerCase() || '';

      let cat = indianVisionModel.categories.find(c =>
        c.keywords?.some(k => pText.includes(k))
      ) || indianVisionModel.categories[0];

      return {
        isValidFood: true,
        foodName: cat.name,
        cal: cat.cal || 200,
        protein: cat.protein || 5,
        carbs: cat.carbs || 30,
        fat: cat.fat || 5,
        emoji: cat.emoji || '🍛',
        confidence: 75,
        modelName: MODEL_ID,
        source: 'MobileNet Fallback'
      };
    }

    return { isValidFood: false, errorMessage: 'Model not ready', foodName: null, modelName: MODEL_ID };

  } catch (err) {
    console.error('analyzeImageWithModel error:', err);
    return { isValidFood: false, errorMessage: 'Recognition failed', foodName: null, modelName: MODEL_ID };
  }
}

export function parseFoodDescription(desc) {
  const EMPTY = {
    textAdditions: { additions: [], extraCal: 0, extraProtein: 0, extraCarbs: 0, extraFat: 0 },
    weightGram: null,
    detectedRecipe: null,
    multiplier: null
  };

  if (!desc || desc.trim() === '') return EMPTY;
  const lower = desc.toLowerCase().trim();

  // ── Detect gram quantity e.g. "200g", "300 g" ────────────────────────────
  let weightGram = null;
  const gramMatch = lower.match(/(\d+)\s*g\b/);
  if (gramMatch) weightGram = parseInt(gramMatch[1]);

  // ── Detect number of items e.g. "2 chapati", "3 rotis" ──────────────────
  let countMatch = lower.match(/^(\d+)\s+/);
  let itemCount = countMatch ? parseInt(countMatch[1]) : null;

  // ── Find food in dataset ─────────────────────────────────────────────────
  let detectedRecipe = null;
  let multiplier = null;

  detectedRecipe = foodDataset.find(item => lower.includes(item.name.toLowerCase())) || null;

  if (!detectedRecipe) {
    const cat = indianVisionModel.categories.find(c =>
      c.keywords?.some(k => lower.includes(k)) || lower.includes(c.name.toLowerCase())
    );
    if (cat) {
      detectedRecipe = { name: cat.name, cal: cat.cal || 200, protein: cat.protein || 5,
        carbs: cat.carbs || 30, fat: cat.fat || 5, emoji: cat.emoji || '🍛' };
    }
  }

  // ── Calculate multiplier ─────────────────────────────────────────────────
  if (detectedRecipe) {
    if (weightGram) {
      // Use gram weight: assume dataset cal is per 100g
      multiplier = Math.round((weightGram / 100) * 10) / 10;
    } else if (itemCount) {
      // Use item count: "2 chapati" → 2x
      multiplier = itemCount;
    }
  }

  // ── Parse extra additions in description ─────────────────────────────────
  const additions = [];
  let extraCal = 0, extraProtein = 0, extraCarbs = 0, extraFat = 0;

  const extras = [
    { keywords: ['ghee', 'butter'], cal: 45, protein: 0, carbs: 0, fat: 5, label: 'Ghee/Butter' },
    { keywords: ['egg', 'eggs'],    cal: 70, protein: 6, carbs: 1, fat: 5, label: 'Egg' },
    { keywords: ['curd', 'dahi', 'yogurt'], cal: 60, protein: 3, carbs: 4, fat: 3, label: 'Curd' },
    { keywords: ['cheese', 'paneer'], cal: 80, protein: 5, carbs: 1, fat: 6, label: 'Cheese/Paneer' },
    { keywords: ['milk'],           cal: 60, protein: 3, carbs: 5, fat: 3, label: 'Milk' },
    { keywords: ['oil'],            cal: 40, protein: 0, carbs: 0, fat: 5, label: 'Oil' },
    { keywords: ['sugar', 'jaggery'], cal: 50, protein: 0, carbs: 13, fat: 0, label: 'Sugar' },
  ];

  extras.forEach(extra => {
    if (extra.keywords.some(k => lower.includes(k))) {
      const m = lower.match(new RegExp('(\\d+)\\s*(?:extra\\s+)?(?:' + extra.keywords.join('|') + ')'));
      const count = m ? parseInt(m[1]) : 1;
      additions.push({ item: extra.label, cal: extra.cal * count });
      extraCal += extra.cal * count;
      extraProtein += extra.protein * count;
      extraCarbs += extra.carbs * count;
      extraFat += extra.fat * count;
    }
  });

  if (lower.includes('less oil') || lower.includes('no oil'))   extraCal -= 40;
  if (lower.includes('less sugar') || lower.includes('no sugar')) extraCal -= 50;

  return {
    textAdditions: { additions, extraCal, extraProtein, extraCarbs, extraFat },
    weightGram,
    detectedRecipe,
    multiplier
  };
}

export function parseDescriptionAdditions(desc) {
  if (!desc) return [];
  const items = [];
  const words = desc.toLowerCase().split(/\s+/);
  if (words.includes('ghee') || words.includes('butter'))
    items.push({ name: 'Ghee / Butter', cal: 45, protein: 0, carbs: 0, fat: 5 });
  if (words.includes('curd') || words.includes('yogurt'))
    items.push({ name: 'Curd / Dahi', cal: 60, protein: 3, carbs: 4, fat: 3 });
  return items;
}

export function searchFoodDataset(query) {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase().trim();
  return foodDataset.filter(item =>
    item.name.toLowerCase().includes(q) ||
    (item.category && item.category.toLowerCase().includes(q))
  ).slice(0, 15);
}


// Preload models on module load
initModels();
