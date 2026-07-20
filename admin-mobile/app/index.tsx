import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Image, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { useAuth } from '../src/store/auth';
import api from '../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth((state) => state.login);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        await login(response.data.user || { id: '1', name: 'Admin', email, role: 'admin' }, response.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}
        >
          <View className="mb-10 mt-4 items-center">
            <View style={[styles.iconContainer, isDark ? styles.iconContainerDark : styles.iconContainerLight]}>
              <Image 
                source={require('../assets/icon.png')} 
                style={{ width: 68, height: 68, borderRadius: 18 }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-[32px] font-bold text-slate-900 dark:text-white mb-2 tracking-tight text-center">Welcome Back</Text>
            <Text className="text-[16px] text-slate-500 dark:text-gray-400 text-center px-6 leading-6">Sign in to your admin workspace to manage your store.</Text>
          </View>

          {error ? (
            <View className="mb-6 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20">
              <Text className="text-red-600 dark:text-red-400 text-[15px] font-medium text-center">{error}</Text>
            </View>
          ) : null}

          <View className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-white dark:border-white/10 mb-8 gap-y-5" style={isDark ? {} : styles.lightCardShadow}>
            <Input
              label="Email"
              placeholder="admin@daratech.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button 
            label="Continue" 
            onPress={handleLogin} 
            isLoading={loading} 
            className="h-[56px] rounded-full"
          />
          
          <View className="mt-8 flex-row justify-center">
            <Text className="text-system-blue dark:text-indigo-400 text-[16px] font-semibold">Forgot password?</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  lightCardShadow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    padding: 4,
    borderRadius: 24,
    marginBottom: 24,
  },
  iconContainerLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
