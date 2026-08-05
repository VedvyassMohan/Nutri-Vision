import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { asyncAuthService } from '../services/asyncAuthService';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  isDarkMode: boolean;
}

export default function AuthScreen({ onAuthSuccess, isDarkMode }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('user@nutrivision.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      let user: User;
      if (isLogin) {
        user = await asyncAuthService.login(email, password);
      } else {
        user = await asyncAuthService.signup(name, email, password);
      }
      onAuthSuccess(user);
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const inputBg = isDarkMode ? '#0f172a' : '#f1f5f9';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBox}>
            <Text style={styles.brandTitle}>🥗 Nutri-Vision</Text>
            <Text style={[styles.brandSub, { color: mutedColor }]}>
              Local Offline Nutrition & Macro Tracker
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: mutedColor }]}>
              {isLogin ? 'Sign in to access your local meal log' : 'Track your macros & water cycle offline'}
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="e.g. Vedvyass"
                  placeholderTextColor={mutedColor}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="user@nutrivision.com"
                placeholderTextColor={mutedColor}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBox}
              onPress={() => {
                setIsLogin(!isLogin);
                setErrorMessage('');
              }}
            >
              <Text style={[styles.switchText, { color: mutedColor }]}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchHighlight}>
                  {isLogin ? 'Sign Up' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0abab5',
  },
  brandSub: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: '#0abab5',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 14,
  },
  switchHighlight: {
    color: '#0abab5',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
