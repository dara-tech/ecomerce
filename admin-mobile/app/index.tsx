import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-system-bg dark:bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}
      >
        <View className="mb-10 mt-8 items-center">
          <Image 
            source={require('../assets/icon.png')} 
            className="w-16 h-16 rounded-[16px] mb-5 shadow-sm"
            resizeMode="cover"
          />
          <Text className="text-[28px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight text-center">Welcome Back</Text>
          <Text className="text-[16px] text-system-gray dark:text-gray-400 text-center px-4">Sign in to your admin workspace to manage your store.</Text>
        </View>

        {error ? <Text className="mb-6 text-red-500 text-[15px]">{error}</Text> : null}

        <View className="bg-white dark:bg-gray-900 rounded-[24px] p-6 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none mb-8 gap-y-4">
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
        />
        
        <View className="mt-8 flex-row justify-center">
          <Text className="text-system-blue dark:text-white text-[15px] font-medium">Forgot password?</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
