import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MealsScreen from './src/screens/MealsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNavBar from './src/components/BottomNavBar';
import AddMealModal from './src/components/AddMealModal';
import { asyncAuthService } from './src/services/asyncAuthService';
import { asyncDbService } from './src/services/asyncDbService';
import { User, Meal } from './src/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const u = await asyncAuthService.getCurrentUser();
      if (u) {
        setCurrentUser(u);
        setIsDarkMode(!!u.darkMode);
      }
    } catch (e) {
      console.warn('Session error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (u: User) => {
    setCurrentUser(u);
    setIsDarkMode(!!u.darkMode);
    setActiveTab('Home');
  };

  const handleLogout = async () => {
    await asyncAuthService.logout();
    setCurrentUser(null);
  };

  const handleToggleDarkMode = async () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);
    if (currentUser?.id) {
      const updated = await asyncAuthService.updateUser({ darkMode: nextState });
      if (updated) setCurrentUser(updated);
    }
  };

  const handleAddMeal = async (mealData: Omit<Meal, 'id' | 'date' | 'time'>) => {
    if (!currentUser?.id) return;
    await asyncDbService.addMeal(currentUser.id, mealData);
    setActiveTab('Meals');
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: '#0f172a' }]} />;
  }

  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.mainContent}>
        {activeTab === 'Home' && (
          <HomeScreen
            user={currentUser}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'Meals' && (
          <MealsScreen
            user={currentUser}
            isDarkMode={isDarkMode}
            onOpenAddMealModal={() => setIsAddMealModalOpen(true)}
          />
        )}
        {activeTab === 'Profile' && (
          <ProfileScreen
            user={currentUser}
            onUserUpdated={setCurrentUser}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}
      </View>

      <AddMealModal
        visible={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onAddMeal={handleAddMeal}
        isDarkMode={isDarkMode}
      />

      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
});
