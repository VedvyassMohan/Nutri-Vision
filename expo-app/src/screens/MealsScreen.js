import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { asyncDbService } from '../services/asyncDbService';

function MacroBar({ label, value, goal, unit, color, isDarkMode }) {
  const roundedVal = Math.round((value || 0) * 100) / 100;
  const pct = Math.min((roundedVal / goal) * 100, 100);
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const trackBg = isDarkMode ? '#0f172a' : '#f1f5f9';

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroTop}>
        <Text style={[styles.macroLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.macroVal, { color }]}>
          {roundedVal} / {goal}{unit}
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: trackBg }]}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function MealsScreen({ user, isDarkMode, onOpenAddMeal }) {
  const [meals, setMeals] = useState([]);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!user?.id) return;
    loadMealsData();
  }, [user?.id]);

  const loadMealsData = async () => {
    if (!user?.id) return;
    const m = await asyncDbService.getTodaysMeals(user.id);
    const mac = await asyncDbService.getTodaysMacros(user.id);
    setMeals(m);
    setMacros(mac);
  };

  const handleRemoveMeal = async (id) => {
    if (!user?.id) return;
    await asyncDbService.removeMeal(user.id, id);
    loadMealsData();
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';

  const MACROS = [
    { label: 'Protein', value: macros.protein, goal: user?.proteinGoal || 150, unit: 'g', color: '#0abab5' },
    { label: 'Carbs', value: macros.carbs, goal: user?.carbsGoal || 200, unit: 'g', color: '#4a90d9' },
    { label: 'Fat', value: macros.fat, goal: user?.fatGoal || 65, unit: 'g', color: '#ff6b35' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Today's Meals</Text>
          <Text style={[styles.subTitle, { color: mutedColor }]}>
            Track your daily nutrition and macro breakdown
          </Text>
        </View>
        <TouchableOpacity style={styles.btnAddHeader} onPress={onOpenAddMeal}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.btnAddHeaderText}>Add Meal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Macro Overview Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Macro Overview</Text>
          {MACROS.map((m) => (
            <MacroBar key={m.label} {...m} isDarkMode={isDarkMode} />
          ))}
        </View>

        {/* Meal List */}
        <View style={{ marginBottom: 80 }}>
          {meals.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: cardBg }]}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>No meals logged today</Text>
              <Text style={[styles.emptySub, { color: mutedColor }]}>
                Tap + Add Meal below to log your first dish
              </Text>
            </View>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={[styles.mealCard, { backgroundColor: cardBg }]}>
                <TouchableOpacity
                  style={styles.btnRemove}
                  onPress={() => handleRemoveMeal(meal.id)}
                >
                  <Ionicons name="close" size={16} color="#ef4444" />
                </TouchableOpacity>

                <View style={styles.mealImgBox}>
                  {meal.image ? (
                    <Image source={{ uri: meal.image }} style={styles.mealImg} />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{meal.emoji || '🍽️'}</Text>
                  )}
                </View>

                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={[styles.mealName, { color: textColor }]}>{meal.name}</Text>
                  <Text style={[styles.mealTime, { color: mutedColor }]}>{meal.time}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.mealCalNum}>{meal.cal}</Text>
                  <Text style={[styles.mealCalUnit, { color: mutedColor }]}>kcal</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Centered Circular Floating Add Button */}
      <View style={styles.centerAddWrap}>
        <TouchableOpacity style={styles.btnCircleAdd} onPress={onOpenAddMeal}>
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  btnAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0abab5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  btnAddHeaderText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  macroTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyBox: {
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
  },
  btnRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mealImgBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mealImg: {
    width: '100%',
    height: '100%',
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
  },
  mealTime: {
    fontSize: 11,
    marginTop: 2,
  },
  mealCalNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0abab5',
  },
  mealCalUnit: {
    fontSize: 10,
  },
  centerAddWrap: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  btnCircleAdd: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0abab5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
