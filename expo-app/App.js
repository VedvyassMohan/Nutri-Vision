import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { asyncAuthService } from './src/services/asyncAuthService';
import { asyncDbService } from './src/services/asyncDbService';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MealsScreen from './src/screens/MealsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNavBar from './src/components/BottomNavBar';
import AddMealModal from './src/components/AddMealModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [isAddMealVisible, setIsAddMealVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const u = await asyncAuthService.getCurrentUser();
      if (u) {
        setUser(u);
        setIsDarkMode(!!u.darkMode);
      }
    } catch (e) {
      console.warn('Error checking user session:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    setIsDarkMode(!!authUser.darkMode);
  };

  const handleLogout = async () => {
    await asyncAuthService.logout();
    setUser(null);
  };

  const handleToggleDarkMode = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (user) {
      const updated = await asyncAuthService.updateUser({ darkMode: nextMode });
      if (updated) setUser(updated);
    }
  };

  const handleAddMeal = async (newMeal) => {
    if (!user?.id) return;
    await asyncDbService.addMeal(user.id, newMeal);
    // Refresh user state
    const latestUser = await asyncAuthService.getCurrentUser();
    if (latestUser) setUser(latestUser);
  };

  if (loading) {
    return <View style={styles.loadingContainer} />;
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} isDarkMode={isDarkMode} />;
  }

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <View style={styles.mainContent}>
        {activeTab === 'Home' && (
          <HomeScreen user={user} isDarkMode={isDarkMode} />
        )}
        {activeTab === 'Meals' && (
          <MealsScreen
            user={user}
            isDarkMode={isDarkMode}
            onOpenAddMeal={() => setIsAddMealVisible(true)}
          />
        )}
        {activeTab === 'Profile' && (
          <ProfileScreen
            user={user}
            isDarkMode={isDarkMode}
            onLogout={handleLogout}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
      />

      {/* Add Meal Modal Sheet */}
      <AddMealModal
        visible={isAddMealVisible}
        onClose={() => setIsAddMealVisible(false)}
        onAddMeal={handleAddMeal}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainContent: {
    flex: 1,
  },
});
