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
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { searchFoodDataset, parseFoodDescription, analyzeImageLocally, MODEL_ID } from '../services/rnVisionService';
import { RecipeItem, Meal, VisionResult } from '../types';

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
  const [aiVisionResult, setAiVisionResult] = useState<VisionResult | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecipeItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const [descriptionAdditions, setDescriptionAdditions] = useState<{
    additions: { item: string; cal: number }[];
    extraCal: number;
    extraProtein?: number;
    extraCarbs?: number;
    extraFat?: number;
  }>({ additions: [], extraCal: 0, extraProtein: 0, extraCarbs: 0, extraFat: 0 });
  const [parsedWeight, setParsedWeight] = useState<number | null>(null);

  // Live description parser for dish auto-detection, gram weight (e.g. 200g), & extra points
  useEffect(() => {
    if (!description.trim()) {
      setDescriptionAdditions({ additions: [], extraCal: 0, extraProtein: 0, extraCarbs: 0, extraFat: 0 });
      setParsedWeight(null);
      return;
    }
    const parsed = parseFoodDescription(description);
    if (parsed) {
      if (parsed.textAdditions) {
        setDescriptionAdditions(parsed.textAdditions);
      }
      setParsedWeight(parsed.weightGram || null);

      if (parsed.detectedRecipe && !selectedRecipe) {
        setSelectedRecipe(parsed.detectedRecipe);
        setSearchQuery(parsed.detectedRecipe.name);
        if (parsed.multiplier) setServingMultiplier(parsed.multiplier);
      }
    }
  }, [description]);

  const processVisionModel = async (imageUri: string) => {
    setAiAnalyzing(true);
    setAiVisionResult(null);
    try {
      const result = await analyzeImageLocally(imageUri);
      setAiVisionResult(result);

      if (result.isValidFood && result.foodName) {
        const detectedRecipe: RecipeItem = {
          name: result.foodName,
          cal: result.cal || 200,
          protein: result.protein || 5,
          carbs: result.carbs || 30,
          fat: result.fat || 5,
          emoji: result.emoji || '🍛'
        };
        setSelectedRecipe(detectedRecipe);
        setSearchQuery(result.foodName);
        setServingMultiplier(1);
      }
    } catch (err) {
      setAiVisionResult({ isValidFood: false, errorMessage: 'Recognition failed', modelName: MODEL_ID });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 1) {
      const matches = searchFoodDataset(text);
      setSearchResults(matches);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectRecipe = (recipe: RecipeItem) => {
    setSelectedRecipe(recipe);
    setSearchQuery(recipe.name);
    setShowDropdown(false);
    setSearchResults([]);
    setServingMultiplier(1);
  };

  const handleClearSelectedRecipe = () => {
    setSelectedRecipe(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setServingMultiplier(1);
    setAiVisionResult(null);
  };

  const handlePickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to capture food photos.');
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
        processVisionModel(uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  // Base + Extra calculations
  const baseCal = selectedRecipe ? Math.round(selectedRecipe.cal * servingMultiplier) : (aiVisionResult?.isValidFood ? Math.round((aiVisionResult.cal || 200) * servingMultiplier) : 0);
  const baseProtein = selectedRecipe ? (selectedRecipe.protein * servingMultiplier) : (aiVisionResult?.isValidFood ? (aiVisionResult.protein || 5) * servingMultiplier : 0);
  const baseCarbs = selectedRecipe ? (selectedRecipe.carbs * servingMultiplier) : (aiVisionResult?.isValidFood ? (aiVisionResult.carbs || 30) * servingMultiplier : 0);
  const baseFat = selectedRecipe ? (selectedRecipe.fat * servingMultiplier) : (aiVisionResult?.isValidFood ? (aiVisionResult.fat || 5) * servingMultiplier : 0);

  const extraCal = descriptionAdditions.extraCal || 0;
  const extraProtein = descriptionAdditions.extraProtein || 0;
  const extraCarbs = descriptionAdditions.extraCarbs || 0;
  const extraFat = descriptionAdditions.extraFat || 0;

  const finalCal = Math.max(0, baseCal + extraCal);
  const finalProtein = Math.max(0, Math.round((baseProtein + extraProtein) * 10) / 10);
  const finalCarbs = Math.max(0, Math.round((baseCarbs + extraCarbs) * 10) / 10);
  const finalFat = Math.max(0, Math.round((baseFat + extraFat) * 10) / 10);

  const handleSubmit = () => {
    if (!description && !selectedRecipe && !previewImage && !aiVisionResult?.isValidFood) return;

    let finalName = selectedRecipe?.name || (aiVisionResult?.isValidFood ? aiVisionResult.foodName : null) || description || 'Custom Meal';
    let finalEmoji = selectedRecipe?.emoji || (aiVisionResult?.isValidFood ? aiVisionResult.emoji : null) || '🍽️';

    if (description && selectedRecipe && description !== selectedRecipe.name) {
      finalName = `${selectedRecipe.name} (${description})`;
    }

    onAddMeal({
      name: finalName,
      cal: finalCal,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      emoji: finalEmoji,
      image: previewImage
    });

    setDescription('');
    setSearchQuery('');
    setSelectedRecipe(null);
    setPreviewImage(null);
    setAiVisionResult(null);
    setServingMultiplier(1);
    onClose();
  };

  const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#0f172a' : '#f8fafc';
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

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Camera / Photo Preview Box */}
            <View style={styles.previewSquareBox}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="camera-outline" size={44} color="#0abab5" />
                  <Text style={[styles.placeholderText, { color: mutedColor }]}>
                    Capture or Upload Food Photo
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnAction}
                onPress={() => {
                  if (previewImage) {
                    setPreviewImage(null);
                    setAiVisionResult(null);
                  } else {
                    handlePickImage(true);
                  }
                }}
              >
                <Ionicons name={previewImage ? "refresh" : "camera"} size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnActionText}>
                  {previewImage ? 'Retake Photo' : 'Capture & Analyze'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#475569' }]}
                onPress={() => handlePickImage(false)}
              >
                <Ionicons name="image" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* AI Vision Model Banner */}
            {aiAnalyzing && (
              <View style={[styles.aiBanner, { backgroundColor: 'rgba(10, 186, 181, 0.12)' }]}>
                <ActivityIndicator size="small" color="#0abab5" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiBannerTitle}>Analyzing Image...</Text>
                  <Text style={styles.aiBannerSub}>Running model {MODEL_ID}</Text>
                </View>
              </View>
            )}

            {aiVisionResult && !aiAnalyzing && (
              aiVisionResult.isValidFood ? (
                <View style={[styles.aiBanner, { backgroundColor: 'rgba(10, 186, 181, 0.15)' }]}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🤖</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiBannerTag}>Model: {MODEL_ID}</Text>
                    <Text style={styles.aiBannerTitle}>
                      Detected: {aiVisionResult.emoji} {aiVisionResult.foodName}
                    </Text>
                    <Text style={styles.aiBannerSub}>
                      Confidence: {aiVisionResult.confidence}% • Base: {aiVisionResult.cal} kcal
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.aiBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.aiBannerTag, { color: '#ef4444' }]}>Notice</Text>
                    <Text style={[styles.aiBannerTitle, { color: '#ef4444' }]}>Image lacks vital details</Text>
                    <Text style={[styles.aiBannerSub, { color: '#ef4444' }]}>
                      Could not detect food in this photo. Please capture a clear food photo or select a recipe below.
                    </Text>
                  </View>
                </View>
              )
            )}

            {/* Describe Meal Card */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={18} color="#0abab5" style={{ marginRight: 6 }} />
                <Text style={[styles.cardTitle, { color: textColor }]}>Describe or edit your meal</Text>
              </View>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBg, color: textColor }]}
                placeholder="E.g., 200g biryani with 2 extra eggs, less oil..."
                placeholderTextColor={mutedColor}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              {descriptionAdditions.additions.length > 0 && (
                <View style={styles.additionsContainer}>
                  <Text style={styles.additionsTitle}>⚡ Added Points from Description:</Text>
                  <View style={styles.chipsRow}>
                    {descriptionAdditions.additions.map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.chip,
                          item.cal < 0 ? styles.chipNegative : styles.chipPositive
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            item.cal < 0 ? styles.chipTextNegative : styles.chipTextPositive
                          ]}
                        >
                          {item.item} ({item.cal >= 0 ? `+${item.cal}` : item.cal} kcal)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Recipe Search & Dropdown Card */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="search" size={18} color="#0abab5" style={{ marginRight: 6 }} />
                <Text style={[styles.cardTitle, { color: textColor }]}>Search Food Dataset</Text>
              </View>
              <View style={styles.searchWrapper}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="Search recipes (e.g. Biryani, Pizza, Dosa...)"
                  placeholderTextColor={mutedColor}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onFocus={() => searchQuery.trim().length >= 1 && setShowDropdown(true)}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={handleClearSelectedRecipe} style={styles.clearSearchBtn}>
                    <Ionicons name="close-circle" size={18} color={mutedColor} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Dropdown Menu */}
              {showDropdown && searchResults.length > 0 && (
                <View style={[styles.dropdownList, { backgroundColor: inputBg }]}>
                  {searchResults.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectRecipe(item)}
                    >
                      <Text style={{ fontSize: 20, marginRight: 10 }}>{item.emoji}</Text>
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

              {/* Selected Recipe Nutrition Card */}
              {selectedRecipe && (
                <View style={styles.selectedRecipeBox}>
                  <View style={styles.srHeader}>
                    <Text style={styles.srTitle}>
                      {selectedRecipe.emoji} {selectedRecipe.name}
                    </Text>
                    <Text style={styles.srCal}>
                      {Math.round(selectedRecipe.cal * servingMultiplier)} kcal
                    </Text>
                  </View>

                  <View style={styles.srMacrosRow}>
                    <View style={styles.srMacroItem}>
                      <Text style={styles.srMacroLabel}>Protein</Text>
                      <Text style={styles.srMacroVal}>
                        {(selectedRecipe.protein * servingMultiplier).toFixed(1)}g
                      </Text>
                    </View>
                    <View style={styles.srMacroItem}>
                      <Text style={styles.srMacroLabel}>Carbs</Text>
                      <Text style={styles.srMacroVal}>
                        {(selectedRecipe.carbs * servingMultiplier).toFixed(1)}g
                      </Text>
                    </View>
                    <View style={styles.srMacroItem}>
                      <Text style={styles.srMacroLabel}>Fat</Text>
                      <Text style={styles.srMacroVal}>
                        {(selectedRecipe.fat * servingMultiplier).toFixed(1)}g
                      </Text>
                    </View>
                  </View>

                  {/* Portion Selector */}
                  <View style={styles.portionRow}>
                    <Text style={styles.portionLabel}>Portion:</Text>
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
                    {![0.5, 1, 1.5, 2].includes(servingMultiplier) && (
                      <TouchableOpacity style={[styles.portionBtn, styles.portionBtnActive]}>
                        <Text style={[styles.portionBtnText, styles.portionBtnTextActive]}>
                          {parsedWeight ? `${parsedWeight}g` : `${servingMultiplier}x`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Total Meal Calculation Summary Card */}
            {(baseCal > 0 || extraCal !== 0) && (
              <View style={[styles.card, { backgroundColor: cardBg, borderLeftWidth: 4, borderLeftColor: '#0abab5' }]}>
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryTitle, { color: textColor }]}>Total Meal Calculation</Text>
                  <Text style={styles.summaryTotalCal}>{finalCal} kcal</Text>
                </View>

                <View style={styles.summaryBreakdown}>
                  {baseCal > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryRowLabel, { color: mutedColor }]}>
                        Base ({selectedRecipe?.name || aiVisionResult?.foodName || 'Meal'}):
                      </Text>
                      <Text style={[styles.summaryRowVal, { color: textColor }]}>+{baseCal} kcal</Text>
                    </View>
                  )}
                  {extraCal !== 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryRowLabel, { color: '#0abab5' }]}>
                        Description Additions:
                      </Text>
                      <Text style={[styles.summaryRowVal, { color: '#0abab5', fontWeight: '800' }]}>
                        {extraCal > 0 ? `+${extraCal}` : extraCal} kcal
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.macroGrid}>
                  <View style={styles.macroGridItem}>
                    <Text style={styles.macroGridVal}>{finalProtein}g</Text>
                    <Text style={styles.macroGridLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroGridItem}>
                    <Text style={styles.macroGridVal}>{finalCarbs}g</Text>
                    <Text style={styles.macroGridLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroGridItem}>
                    <Text style={styles.macroGridVal}>{finalFat}g</Text>
                    <Text style={styles.macroGridLabel}>Fats</Text>
                  </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingBottom: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  btnClose: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  previewSquareBox: {
    aspectRatio: 1,
    maxWidth: 220,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 186, 181, 0.08)',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 186, 181, 0.2)',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  aiBannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0abab5',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0abab5',
  },
  aiBannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    height: 72,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  additionsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  additionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0abab5',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  chipNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextPositive: {
    color: '#10b981',
  },
  chipTextNegative: {
    color: '#ef4444',
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingRight: 36,
    fontSize: 13,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  dropdownList: {
    borderRadius: 12,
    maxHeight: 180,
    padding: 6,
    marginTop: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownMacros: {
    fontSize: 11,
    marginTop: 2,
  },
  selectedRecipeBox: {
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  srHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  srTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0abab5',
  },
  srCal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0abab5',
  },
  srMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  srMacroItem: {
    alignItems: 'center',
  },
  srMacroLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  srMacroVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0abab5',
    marginRight: 4,
  },
  portionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  portionBtnActive: {
    backgroundColor: '#0abab5',
  },
  portionBtnText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  portionBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryTotalCal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0abab5',
  },
  summaryBreakdown: {
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  summaryRowLabel: {
    fontSize: 11,
  },
  summaryRowVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10, 186, 181, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  macroGridItem: {
    alignItems: 'center',
  },
  macroGridVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0abab5',
  },
  macroGridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  btnSubmit: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0abab5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
