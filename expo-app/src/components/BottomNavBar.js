import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({ activeTab, onTabChange, isDarkMode }) {
  const tabs = [
    { id: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'Meals', label: 'Meals', icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { id: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const activeColor = '#0abab5';
  const inactiveColor = isDarkMode ? '#64748b' : '#94a3b8';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        const color = isActive ? activeColor : inactiveColor;
        return (
          <TouchableOpacity
            key={t.id}
            style={styles.tabButton}
            onPress={() => onTabChange(t.id)}
            activeOpacity={0.7}
          >
            <Ionicons name={isActive ? t.activeIcon : t.icon} size={22} color={color} />
            <Text style={[styles.tabLabel, { color, fontWeight: isActive ? '700' : '500' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 3,
  },
});
