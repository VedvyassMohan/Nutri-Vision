import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { asyncDbService } from '../services/asyncDbService';

function CalorieRing({ consumed, goal, isDarkMode }) {
  const pct = Math.min(consumed / goal, 1);
  const left = Math.max(0, goal - consumed);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ * (1 - pct);

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const trackColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <View style={styles.ringWrapper}>
      <Svg width="180" height="180" viewBox="0 0 180 180">
        <Circle cx="90" cy="90" r={r} fill="none" stroke={trackColor} strokeWidth="12" />
        <Circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="url(#tealGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
        />
        <Defs>
          <LinearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0abab5" />
            <Stop offset="100%" stopColor="#06d6a0" />
          </LinearGradient>
        </Defs>
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringConsumedNum, { color: textColor }]}>{consumed}</Text>
        <Text style={[styles.ringGoalText, { color: mutedColor }]}>/ {goal} kcal</Text>
        <Text style={styles.ringLeftText}>{left} left</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ user, isDarkMode }) {
  const [streakData, setStreakData] = useState({ currentStreak: 1, weekDays: [] });
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterData, setWaterData] = useState({ glasses: 0, goal: 8, targetLiters: 2.0, timerEnabled: true, intervalMinutes: 25 });
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  useEffect(() => {
    if (!user?.id) return;
    loadHomeData();
  }, [user?.id]);

  const loadHomeData = async () => {
    if (!user?.id) return;
    await asyncDbService.recordLogin(user.id);
    const streak = await asyncDbService.getStreak(user.id);
    const m = await asyncDbService.getTodaysMacros(user.id);
    const w = await asyncDbService.getWater(user.id);

    setStreakData(streak);
    setMacros(m);
    setWaterData(w);
    setSecondsLeft((w.intervalMinutes || 25) * 60);
  };

  // Water timer interval countdown
  useEffect(() => {
    if (!waterData.timerEnabled) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? (waterData.intervalMinutes || 25) * 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [waterData.timerEnabled, waterData.intervalMinutes]);

  const handleLogGlass = async (delta = 1) => {
    if (!user?.id) return;
    const updated = await asyncDbService.logGlass(user.id, delta);
    if (updated) setWaterData(updated);
  };

  const handleToggleTimer = async () => {
    if (!user?.id) return;
    const nextState = !waterData.timerEnabled;
    const updated = await asyncDbService.setWater(user.id, { timerEnabled: nextState });
    if (updated) setWaterData(updated);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';

  const goalGlasses = Math.round((waterData.targetLiters || 2.0) * 4);
  const currentGlasses = waterData.glasses || 0;
  const isCompleted = currentGlasses >= goalGlasses;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: mutedColor }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: textColor }]}>{user?.name || 'User'}!</Text>
          </View>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
        </View>

        {/* Login Streak Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakIcon}>📈</Text>
            <Text style={[styles.cardTitle, { color: textColor }]}>Login Streak</Text>
          </View>
          <View style={styles.streakDotsRow}>
            {streakData.weekDays.map((d, i) => (
              <View key={i} style={styles.streakDayItem}>
                <View style={[styles.dot, d.active && styles.dotActive]}>
                  {d.active && <View style={styles.dotInner} />}
                </View>
                <Text style={[styles.dayLabel, { color: mutedColor }]}>{d.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.streakCount}>
            {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} streak! 🔥
          </Text>
        </View>

        {/* Calorie Ring Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 12 }]}>
            Today's Calories
          </Text>
          <CalorieRing
            consumed={macros.calories}
            goal={user?.calorieGoal || 2000}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Mini Macro Summary Row */}
        <View style={styles.macroRow}>
          <View style={[styles.macroMiniCard, { backgroundColor: cardBg }]}>
            <Text style={styles.macroMiniLabel}>PROTEIN</Text>
            <Text style={[styles.macroMiniVal, { color: textColor }]}>
              {Math.round(macros.protein)}g / {user?.proteinGoal || 150}g
            </Text>
          </View>
          <View style={[styles.macroMiniCard, { backgroundColor: cardBg }]}>
            <Text style={styles.macroMiniLabel}>CARBS</Text>
            <Text style={[styles.macroMiniVal, { color: textColor }]}>
              {Math.round(macros.carbs)}g / {user?.carbsGoal || 200}g
            </Text>
          </View>
          <View style={[styles.macroMiniCard, { backgroundColor: cardBg }]}>
            <Text style={styles.macroMiniLabel}>FAT</Text>
            <Text style={[styles.macroMiniVal, { color: textColor }]}>
              {Math.round(macros.fat)}g / {user?.fatGoal || 65}g
            </Text>
          </View>
        </View>

        {/* Water Cycle Tracker Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.waterTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>💧</Text>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>Water Cycle</Text>
                <Text style={[styles.waterSubText, { color: mutedColor }]}>
                  {currentGlasses * 250}ml / {goalGlasses * 250}ml Target
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, waterData.timerEnabled && styles.toggleBtnOn]}
              onPress={handleToggleTimer}
            >
              <View style={[styles.toggleKnob, waterData.timerEnabled && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>

          <View style={styles.timerRow}>
            <Text style={[styles.timerText, { color: mutedColor }]}>
              ⏱️ {waterData.timerEnabled ? `Next drink in: ${formatTime(secondsLeft)}` : 'Timer Paused'}
            </Text>
          </View>

          {/* Glasses Grid */}
          <View style={styles.glassesGrid}>
            {Array.from({ length: goalGlasses }).map((_, idx) => {
              const isFilled = idx < currentGlasses;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.glassItem, isFilled && styles.glassItemFilled]}
                  onPress={() => handleLogGlass(isFilled ? -1 : 1)}
                >
                  <Text style={{ fontSize: 18 }}>{isFilled ? '🥛' : '🫗'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Water Log Controls */}
          <View style={styles.waterControlsRow}>
            <TouchableOpacity style={styles.btnWaterDec} onPress={() => handleLogGlass(-1)}>
              <Text style={styles.btnWaterDecText}>- Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnWaterInc} onPress={() => handleLogGlass(1)}>
              <Text style={styles.btnWaterIncText}>+ Log Glass (250ml)</Text>
            </TouchableOpacity>
          </View>

          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>
                🏆 Daily Water Target Reached! ({(currentGlasses * 0.25).toFixed(1)}L logged)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
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
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  streakDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  streakDayItem: {
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dotActive: {
    backgroundColor: '#0abab5',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  dayLabel: {
    fontSize: 11,
  },
  streakCount: {
    color: '#0abab5',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringConsumedNum: {
    fontSize: 28,
    fontWeight: '800',
  },
  ringGoalText: {
    fontSize: 13,
  },
  ringLeftText: {
    color: '#0abab5',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  macroMiniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  macroMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0abab5',
    marginBottom: 4,
  },
  macroMiniVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  waterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    padding: 2,
  },
  toggleBtnOn: {
    backgroundColor: '#0abab5',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  timerRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 13,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  glassItem: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassItemFilled: {
    backgroundColor: 'rgba(10, 186, 181, 0.15)',
  },
  waterControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnWaterDec: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWaterDecText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  btnWaterInc: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWaterIncText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  completedBadgeText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});
