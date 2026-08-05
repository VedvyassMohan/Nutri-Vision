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
import { User, Meal } from '../types';

interface MealsScreenProps {
  user: User;
  isDarkMode: boolean;
  onOpenAddMealModal: () => void;
}

export default function MealsScreen({ user, isDarkMode, onOpenAddMealModal }: MealsScreenProps) {
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    loadMeals();
  }, [user?.id]);

  const loadMeals = async () => {
    if (!user?.id) return;
    const list = await asyncDbService.getTodaysMeals(user.id);
    setMeals(list);
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!user?.id) return;
    await asyncDbService.removeMeal(user.id, mealId);
    loadMeals();
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Today's Meals</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          {meals.length} meal{meals.length !== 1 ? 's' : ''} logged today
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {meals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No meals logged yet</Text>
            <Text style={[styles.emptySub, { color: mutedColor }]}>
              Tap the circular '+' button below to log your breakfast, lunch, or dinner!
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
                <Text style={[styles.mealTime, { color: mutedColor }]}>{item.time}</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  mealCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  mealImg: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  mealEmojiBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0abab5',
  },
  btnDelete: {
    padding: 6,
    marginTop: 4,
  },
  fabAdd: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
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
