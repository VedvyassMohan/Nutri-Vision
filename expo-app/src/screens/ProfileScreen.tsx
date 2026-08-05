import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { asyncAuthService } from '../services/asyncAuthService';
import { asyncDbService } from '../services/asyncDbService';
import { User } from '../types';

interface ProfileScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ProfileScreen({
  user,
  onUserUpdated,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: ProfileScreenProps) {
  const [height, setHeight] = useState(String(user?.height || 170));
  const [weight, setWeight] = useState(String(user?.weight || 70));
  const [age, setAge] = useState(String(user?.age || 25));
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [goal, setGoal] = useState(user?.goal || 'Maintain Weight');
  const [stats, setStats] = useState({ avgCalories: 0, bestStreak: 1, totalMealsLogged: 0 });

  useEffect(() => {
    if (user?.id) {
      asyncDbService.getStats(user.id).then(setStats);
    }
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    const updated = await asyncAuthService.updateUser({
      height: parseFloat(height) || 170,
      weight: parseFloat(weight) || 70,
      age: parseFloat(age) || 25,
      gender,
      goal
    });

    if (updated) {
      onUserUpdated(updated);
      Alert.alert('Profile Saved', 'Your macro goals have been dynamically updated.');
    }
  };

  const calculateHeightFactor = (h: number) => {
    const norm = (h - 140) / 60;
    const factor = Math.max(0.7, Math.min(1.3, 0.8 + norm * 0.4));
    return factor.toFixed(2);
  };

  const heightVal = parseFloat(height) || 170;
  const heightFactor = calculateHeightFactor(heightVal);

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const inputBg = isDarkMode ? '#0f172a' : '#f1f5f9';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: textColor }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: mutedColor }]}>{user?.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={styles.statVal}>{stats.avgCalories}</Text>
            <Text style={[styles.statLbl, { color: mutedColor }]}>Avg Daily kcal</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={styles.statVal}>{stats.bestStreak}d</Text>
            <Text style={[styles.statLbl, { color: mutedColor }]}>Best Streak</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={styles.statVal}>{stats.totalMealsLogged}</Text>
            <Text style={[styles.statLbl, { color: mutedColor }]}>Meals Logged</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Profile & BMR Parameters</Text>
            <View style={styles.badgeFactor}>
              <Text style={styles.badgeFactorText}>HF: {heightFactor}x</Text>
            </View>
          </View>

          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: textColor }]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: textColor }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          <View style={styles.grid2Col}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: textColor }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: textColor }]}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: textColor, marginTop: 12 }]}>Primary Goal</Text>
          <View style={styles.goalsRow}>
            {['Lose Weight', 'Maintain Weight', 'Gain Muscle'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.goalBtn, goal === g && styles.goalBtnActive]}
                onPress={() => setGoal(g)}
              >
                <Text style={[styles.goalBtnText, goal === g && styles.goalBtnTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btnSave} onPress={handleSaveProfile}>
            <Text style={styles.btnSaveText}>Update Macro Targets</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <TouchableOpacity style={styles.settingRow} onPress={onToggleDarkMode}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={20}
                color="#0abab5"
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.settingText, { color: textColor }]}>Dark Appearance Mode</Text>
            </View>
            <View style={[styles.toggleBtn, isDarkMode && styles.toggleBtnOn]}>
              <View style={[styles.toggleKnob, isDarkMode && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.btnLogoutText}>Sign Out</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0abab5',
  },
  statLbl: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeFactor: {
    backgroundColor: 'rgba(10, 186, 181, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeFactorText: {
    color: '#0abab5',
    fontSize: 11,
    fontWeight: '800',
  },
  grid2Col: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#0abab5',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  genderBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  goalBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBtnActive: {
    backgroundColor: '#0abab5',
  },
  goalBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  goalBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnSave: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0abab5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
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
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 4,
  },
  btnLogoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
