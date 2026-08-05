import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { searchFoodDataset, parseFoodDescription, analyzeImageLocally } from '../services/rnVisionService';
import { RecipeItem, Meal } from '../types';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMeal: (meal: Omit<Meal, 'id' | 'date' | 'time'>) => void;
  isDarkMode: boolean;
}

export default function AddMealModal({ visible, onClose, onAddMeal, isDarkMode }: AddMealModalProps) {
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecipeItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const [descriptionAdditions, setDescriptionAdditions] = useState<{ additions: { item: string; cal: number }[]; extraCal: number }>({ additions: [], extraCal: 0 });
  const [parsedWeight, setParsedWeight] = useState<number | null>(null);

  useEffect(() => {
    if (!description.trim()) {
      setDescriptionAdditions({ additions: [], extraCal: 0 });
      setParsedWeight(null);
      return;
    }
    const parsed = parseFoodDescription(description);
    if (parsed) {
      setDescriptionAdditions(parsed.textAdditions || { additions: [], extraCal: 0 });
      setParsedWeight(parsed.weightGram || null);

      if (parsed.detectedRecipe && !selectedRecipe) {
        setSelectedRecipe(parsed.detectedRecipe);
        setSearchQuery(parsed.detectedRecipe.name);
        if (parsed.multiplier) setServingMultiplier(parsed.multiplier);
      }
    }
  }, [description]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 1) {
      const matches = searchFoodDataset(text);
      setSearchResults(matches);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectRecipe = (recipe: RecipeItem) => {
    setSelectedRecipe(recipe);
    setSearchQuery(recipe.name);
    setSearchResults([]);
    setServingMultiplier(1);
  };

  const handlePickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPreviewImage(uri);

        setAiAnalyzing(true);
        const visionRes = await analyzeImageLocally(uri);
        setAiResult(visionRes);
        setAiAnalyzing(false);

        if (visionRes.isValidFood && visionRes.foodName) {
          setSelectedRecipe({
            name: visionRes.foodName,
            cal: visionRes.cal || 200,
            protein: visionRes.protein || 5,
            carbs: visionRes.carbs || 30,
            fat: visionRes.fat || 5,
            emoji: visionRes.emoji || '🍛'
          });
          setSearchQuery(visionRes.foodName);
        }
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const baseCal = selectedRecipe ? Math.round(selectedRecipe.cal * servingMultiplier) : 0;
  const baseProtein = selectedRecipe ? (selectedRecipe.protein * servingMultiplier) : 0;
  const baseCarbs = selectedRecipe ? (selectedRecipe.carbs * servingMultiplier) : 0;
  const baseFat = selectedRecipe ? (selectedRecipe.fat * servingMultiplier) : 0;

  const finalCal = Math.max(0, baseCal + descriptionAdditions.extraCal);

  const handleSubmit = () => {
    if (!description && !selectedRecipe && !previewImage) return;

    onAddMeal({
      name: selectedRecipe?.name || description || 'Custom Meal',
      cal: finalCal,
      protein: Math.round(baseProtein),
      carbs: Math.round(baseCarbs),
      fat: Math.round(baseFat),
      emoji: selectedRecipe?.emoji || '🍽️',
      image: previewImage
    });

    setDescription('');
    setSearchQuery('');
    setSelectedRecipe(null);
    setPreviewImage(null);
    setAiResult(null);
    setServingMultiplier(1);
    onClose();
  };

  const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const inputBg = isDarkMode ? '#0f172a' : '#f1f5f9';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { backgroundColor: bgColor }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandleBar} />
            <View style={styles.headerTitleRow}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>Add Meal</Text>
              <TouchableOpacity onPress={onClose} style={styles.btnClose}>
                <Ionicons name="close" size={22} color={mutedColor} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.previewSquareBox}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="camera-outline" size={40} color={mutedColor} />
                  <Text style={[styles.placeholderText, { color: mutedColor }]}>
                    Capture or Upload Photo
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnAction}
                onPress={() => handlePickImage(true)}
              >
                <Ionicons name="camera" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnActionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#475569' }]}
                onPress={() => handlePickImage(false)}
              >
                <Ionicons name="image" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {aiResult?.isValidFood && (
              <View style={styles.aiBanner}>
                <Text style={styles.aiBannerText}>
                  🤖 Detected: {aiResult.emoji} {aiResult.foodName} ({aiResult.confidence}% confidence)
                </Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: textColor }]}>Describe your meal</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, color: textColor }]}
              placeholder="e.g. 2 chapati with extra ghee, less oil..."
              placeholderTextColor={mutedColor}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.sectionLabel, { color: textColor, marginTop: 12 }]}>
              Search Recipes
            </Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="Search (e.g. Biryani, Paneer, Dosa...)"
              placeholderTextColor={mutedColor}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />

            {searchResults.length > 0 && (
              <View style={[styles.dropdown, { backgroundColor: inputBg }]}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectRecipe(item)}
                  >
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownName, { color: textColor }]}>{item.name}</Text>
                      <Text style={[styles.dropdownMacros, { color: mutedColor }]}>
                        {item.cal} kcal • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedRecipe && (
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>
                  {selectedRecipe.emoji} {selectedRecipe.name} ({finalCal} kcal)
                </Text>
                <View style={styles.portionRow}>
                  <Text style={{ fontSize: 12, color: '#0abab5', fontWeight: '700' }}>Portion:</Text>
                  {[0.5, 1, 1.5, 2].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.portionBtn, servingMultiplier === m && styles.portionBtnActive]}
                      onPress={() => setServingMultiplier(m)}
                    >
                      <Text style={[styles.portionBtnText, servingMultiplier === m && styles.portionBtnTextActive]}>
                        {m}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
              <Text style={styles.btnSubmitText}>Add Meal ({finalCal} kcal)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  btnClose: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  previewSquareBox: {
    aspectRatio: 1,
    maxWidth: 240,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  btnAction: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0abab5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  aiBanner: {
    backgroundColor: 'rgba(10, 186, 181, 0.15)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  aiBannerText: {
    color: '#0abab5',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  textArea: {
    height: 70,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 12,
    maxHeight: 180,
    padding: 8,
    marginBottom: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownMacros: {
    fontSize: 11,
  },
  recipeCard: {
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  recipeTitle: {
    color: '#0abab5',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  portionBtnActive: {
    backgroundColor: '#0abab5',
  },
  portionBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  portionBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnSubmit: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
