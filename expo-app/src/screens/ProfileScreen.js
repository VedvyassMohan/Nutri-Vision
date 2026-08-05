import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { asyncAuthService } from '../services/asyncAuthService';
import { asyncDbService } from '../services/asyncDbService';

export default function ProfileScreen({ user, isDarkMode, onLogout, onToggleDarkMode }) {
  const [personalDetails, setPersonalDetails] = useState({
    height: String(user?.height || 170),
    weight: String(user?.weight || 70),
    age: String(user?.age || 25),
    gender: user?.gender || 'Male',
    goal: user?.goal || 'Maintain Weight'
  });

  const [stats, setStats] = useState({ avgCalories: 0, bestStreak: 1, totalMealsLogged: 0 });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadProfileStats();
  }, [user?.id]);

  const loadProfileStats = async () => {
    if (!user?.id) return;
    const s = await asyncDbService.getStats(user.id);
    setStats(s);
  };

  const handleSaveDetails = async () => {
    const updated = await asyncAuthService.updateUser(personalDetails);
    if (updated) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const heightVal = parseFloat(personalDetails.height) || 170;
  const heightFactor = (heightVal / 170).toFixed(2);

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const inputBg = isDarkMode ? '#0f172a' : '#f1f5f9';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={[styles.headerCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarTextLg}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.profileName, { color: textColor }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: mutedColor }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Quick Stats Bar */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={[styles.statVal, { color: textColor }]}>{stats.avgCalories}</Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Avg Cals</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={[styles.statVal, { color: textColor }]}>{stats.bestStreak}d</Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Best Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 18 }}>🍽️</Text>
            <Text style={[styles.statVal, { color: textColor }]}>{stats.totalMealsLogged}</Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Meals</Text>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 16 }]}>
            Personal Details & Goals
          </Text>

          <View style={styles.inputGrid}>
            <View style={styles.inputItem}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={personalDetails.height}
                onChangeText={(v) => setPersonalDetails({ ...personalDetails, height: v })}
              />
            </View>
            <View style={styles.inputItem}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={personalDetails.weight}
                onChangeText={(v) => setPersonalDetails({ ...personalDetails, weight: v })}
              />
            </View>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputItem}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={personalDetails.age}
                onChangeText={(v) => setPersonalDetails({ ...personalDetails, age: v })}
              />
            </View>
            <View style={styles.inputItem}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Gender</Text>
              <View style={[styles.selectorRow, { backgroundColor: inputBg }]}>
                {['Male', 'Female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.selectOpt, personalDetails.gender === g && styles.selectOptActive]}
                    onPress={() => setPersonalDetails({ ...personalDetails, gender: g })}
                  >
                    <Text style={[styles.selectOptText, personalDetails.gender === g && styles.selectOptTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Goals Selection */}
          <Text style={[styles.inputLabel, { color: textColor, marginTop: 12 }]}>Fitness Goal</Text>
          <View style={[styles.selectorColumn, { backgroundColor: inputBg }]}>
            {[
              'Maintain Weight',
              'Lose Weight (-300 kcal)',
              'Gain Muscle (+300 kcal)'
            ].map((goalOption) => (
              <TouchableOpacity
                key={goalOption}
                style={[styles.goalBtn, personalDetails.goal === goalOption && styles.goalBtnActive]}
                onPress={() => setPersonalDetails({ ...personalDetails, goal: goalOption })}
              >
                <Text style={[styles.goalBtnText, personalDetails.goal === goalOption && styles.goalBtnTextActive]}>
                  {goalOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Calculated Targets Summary & Height Factor Badge */}
          <View style={styles.targetBox}>
            <View style={styles.targetBoxHeader}>
              <Text style={styles.targetBoxTitle}>Calculated Target Goals</Text>
              <Text style={styles.heightFactorBadge}>
                📐 Factor: {heightFactor}x ({heightVal}cm)
              </Text>
            </View>
            <View style={styles.pillsRow}>
              <View style={styles.pill}><Text style={styles.pillVal}>{user?.calorieGoal || 2000} kcal</Text></View>
              <View style={styles.pill}><Text style={styles.pillVal}>{user?.proteinGoal || 150}g Protein</Text></View>
              <View style={styles.pill}><Text style={styles.pillVal}>{user?.carbsGoal || 200}g Carbs</Text></View>
              <View style={styles.pill}><Text style={styles.pillVal}>{user?.fatGoal || 65}g Fat</Text></View>
            </View>
          </View>

          <TouchableOpacity style={styles.btnSave} onPress={handleSaveDetails}>
            <Text style={styles.btnSaveText}>
              {savedSuccess ? 'Goals Saved! ✓' : 'Update & Recalculate Goals'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 14 }]}>
            App Preferences
          </Text>

          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="moon-outline" size={20} color={textColor} style={{ marginRight: 10 }} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={onToggleDarkMode} trackColor={{ true: '#0abab5' }} />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.btnLogoutText}>Log Out</Text>
        </TouchableOpacity>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLg: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  selectorRow: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    padding: 3,
  },
  selectOpt: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOptActive: {
    backgroundColor: '#0abab5',
  },
  selectOptText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  selectOptTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  selectorColumn: {
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  goalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  goalBtnActive: {
    backgroundColor: '#0abab5',
  },
  goalBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  goalBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  targetBox: {
    backgroundColor: 'rgba(10, 186, 181, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  targetBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetBoxTitle: {
    color: '#0abab5',
    fontWeight: '700',
    fontSize: 13,
  },
  heightFactorBadge: {
    fontSize: 11,
    color: '#0abab5',
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#0abab5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pillVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  btnSave: {
    backgroundColor: '#0abab5',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnLogout: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  btnLogoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
