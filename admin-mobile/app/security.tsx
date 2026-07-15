import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Shield, Key, Lock, Smartphone, Save } from 'lucide-react-native';

export default function SecurityScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    require2fa: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    password: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Security settings updated successfully');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    }, 800);
  };


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F2F2F7' }}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Security & Access',
          headerBackTitle: 'Menu',
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading} className="px-3 py-1">
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text className="text-[17px] font-semibold text-system-blue dark:text-white">Save</Text>
              )}
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="gap-y-6">
          
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Access Controls</Text>
            
            <View className="flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-2">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Require 2FA for Admins</Text>
              <Switch
                value={formData.require2fa}
                onValueChange={(val) => setFormData(prev => ({ ...prev, require2fa: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Timeout (min)"
                  value={formData.sessionTimeout}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, sessionTimeout: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Max Attempts"
                  value={formData.maxLoginAttempts}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxLoginAttempts: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Change Password</Text>
            
            <View className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-2">
              <Text className="text-[13px] text-amber-800">
                You will be logged out on all other devices if you change your password.
              </Text>
            </View>

            <Input
              label="New Password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />
            <Input
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
            />
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
