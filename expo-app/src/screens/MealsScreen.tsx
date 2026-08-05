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
import { User, Meal, Macros } from '../types';

interface MealsScreenProps {
  user: User;
  isDarkMode: boolean;
  onOpenAddMealModal: () => void;
}

function MacroBar({ label, value, goal, unit, color, isDarkMode }: { label: string; value: number; goal: number; unit: string; color: string; isDarkMode: boolean }) {
  const roundedVal = Math.round((value || 0) * 10) / 10;
  const pct = Math.min((roundedVal / (goal || 1)) * 100, 100);
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const trackBg = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroTop}>
        <Text style={[styles.macroLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.macroVal, { color: mutedColor }]}>
          {roundedVal}/{goal}{unit}
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: trackBg }]}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function MealsScreen({ user, isDarkMode, onOpenAddMealModal }: MealsScreenProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [macros, setMacros] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    const list = await asyncDbService.getTodaysMeals(user.id);
    const macs = await asyncDbService.getTodaysMacros(user.id);
    setMeals(list);
    setMacros(macs);
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!user?.id) return;
    await asyncDbService.removeMeal(user.id, mealId);
    loadData();
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
      {/* Header with Title and Add Meal Button */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Today's Meals</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            Track your daily nutrition and macro breakdown
          </Text>
        </View>
        <TouchableOpacity style={styles.btnHeaderAdd} onPress={onOpenAddMealModal}>
          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.btnHeaderAddText}>Add Meal</Text>
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

        {/* Meal List Section */}
        {meals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🍽️</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No meals logged today</Text>
            <Text style={[styles.emptySub, { color: mutedColor }]}>
              Tap + Add Meal to log your first dish
            </Text>
          </View>
        ) : (
          meals.map((item) => (
            <View key={item.id} style={[styles.mealCard, { backgroundColor: cardBg }]}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.mealImg} />
              ) : (
                <View style={styles.mealEmojiBox}>
                  <Text style={{ fontSize: 24 }}>{item.emoji || '🍲'}</Text>
                </View>
              )}

              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.mealTime, { color: mutedColor }]}>{item.time || 'Today'}</Text>
                <Text style={styles.mealMacros}>
                  P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                </Text>
              </View>

              <View style={styles.mealRight}>
                <Text style={styles.mealCal}>{item.cal} kcal</Text>
                <TouchableOpacity
                  style={styles.btnDelete}
                  onPress={() => handleRemoveMeal(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Center Circular Add Button */}
      <TouchableOpacity
        style={styles.fabAdd}
        onPress={onOpenAddMealModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  btnHeaderAdd: {
    backgroundColor: '#0abab5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnHeaderAddText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    fontWeight: '700',
  },
  macroVal: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  mealCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  mealImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  mealEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700',
  },
  mealTime: {
    fontSize: 11,
    marginTop: 2,
  },
  mealMacros: {
    fontSize: 11,
    color: '#0abab5',
    fontWeight: '600',
    marginTop: 2,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  mealCal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0abab5',
  },
  btnDelete: {
    padding: 4,
    marginTop: 4,
  },
  fabAdd: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#0abab5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
