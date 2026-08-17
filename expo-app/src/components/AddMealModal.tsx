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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
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

      if (parsed.detectedRecipe) {
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
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: bgColor }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandleBar} />
            <View style={styles.headerTitleRow}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>Add Meal</Text>
              <TouchableOpacity onPress={onClose} style={styles.btnClose}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Scrollable View */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {/* Camera / Photo Preview Box */}
            <View style={styles.previewSquareBox}>
              <View style={styles.statusBadgeLeft}>
                <View style={styles.recDot} />
              </View>
              <View style={styles.statusBadgeRight}>
                <Text style={styles.statusBadgeText}>Ready</Text>
              </View>

              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="camera" size={48} color="#0abab5" />
                  <Text style={[styles.placeholderText, { color: mutedColor }]}>
                    Capture or Upload Food Photo
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.btnCapture}
              onPress={() => {
                if (previewImage) {
                  setPreviewImage(null);
                  setAiVisionResult(null);
                } else {
                  handlePickImage(true);
                }
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>📷</Text>
              <Text style={styles.btnCaptureText}>
                {previewImage ? 'Retake Photo' : 'Capture & Analyze with Vision AI'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnUpload}
              onPress={() => handlePickImage(false)}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>🖼️</Text>
              <Text style={[styles.btnUploadText, { color: mutedColor }]}>
                Upload photo from gallery
              </Text>
            </TouchableOpacity>

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
                  <Text style={{ fontSize: 22, marginRight: 10 }}>🤖</Text>
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
                  <Text style={{ fontSize: 22, marginRight: 10 }}>⚠️</Text>
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
                placeholder="E.g., with 2 extra eggs, + 1 cup rice, less oil, extra cheese..."
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
                  placeholder="Search recipes (e.g. Chicken, Pizza, Omelet...)"
                  placeholderTextColor={mutedColor}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onFocus={() => searchQuery.trim().length >= 1 && setShowDropdown(true)}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={handleClearSelectedRecipe} style={styles.clearSearchBtn}>
                    <Ionicons name="close-circle" size={20} color={mutedColor} />
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
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{item.emoji}</Text>
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

            {/* Add Meal Submit Button */}
            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
              <Text style={styles.btnSubmitText}>Add Meal ({finalCal} kcal)</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  btnClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  previewSquareBox: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 186, 181, 0.08)',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 186, 181, 0.25)',
    position: 'relative',
  },
  statusBadgeLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  statusBadgeRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
  btnCapture: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0abab5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#0abab5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnCaptureText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  btnUpload: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  btnUploadText: {
    fontWeight: '700',
    fontSize: 13,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  aiBannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0abab5',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0abab5',
  },
  aiBannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  textArea: {
    height: 80,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  additionsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  additionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0abab5',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingRight: 38,
    fontSize: 14,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  dropdownList: {
    borderRadius: 14,
    maxHeight: 200,
    padding: 8,
    marginTop: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownMacros: {
    fontSize: 11,
    marginTop: 2,
  },
  selectedRecipeBox: {
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  srHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  srTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0abab5',
  },
  srCal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0abab5',
  },
  srMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  srMacroItem: {
    alignItems: 'center',
  },
  srMacroLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  srMacroVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0abab5',
    marginRight: 4,
  },
  portionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
  },
  portionBtnActive: {
    backgroundColor: '#0abab5',
  },
  portionBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  portionBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryTotalCal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0abab5',
  },
  summaryBreakdown: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryRowLabel: {
    fontSize: 12,
  },
  summaryRowVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  macroGridItem: {
    alignItems: 'center',
  },
  macroGridVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0abab5',
  },
  macroGridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  btnSubmit: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#0abab5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
});
