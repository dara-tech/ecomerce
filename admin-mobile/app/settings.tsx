import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch, Appearance } from 'react-native';
import { Stack, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Input } from '../src/components/ui/Input';
import { Store, Globe, DollarSign, Mail, CreditCard, Save } from 'lucide-react-native';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [formData, setFormData] = useState({
    storeName: 'LUMINA',
    storeEmail: 'contact@lumina.com',
    storePhone: '+1 (555) 123-4567',
    currency: 'USD',
    currencyFormat: '$',
    taxRate: '8.5',
    taxEnabled: true,
    stripePublic: 'pk_test_...',
    smtpHost: 'smtp.sendgrid.net',
  });

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call since no endpoint exists yet
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Global settings updated successfully');
    }, 800);
  };


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Store Settings',
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Appearance</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] text-gray-700 dark:text-gray-300">Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={(val) => {
                  setIsDark(val);
                  const newTheme = val ? 'dark' : 'light';
                  setColorScheme(newTheme);
                  Appearance.setColorScheme(newTheme);
                  import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
                    AsyncStorage.setItem('app_theme', newTheme);
                  });
                }}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Store Information</Text>
            <Input
              label="Store Name"
              value={formData.storeName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, storeName: text }))}
            />
            <Input
              label="Contact Email"
              value={formData.storeEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, storeEmail: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Contact Phone"
              value={formData.storePhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, storePhone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Currency & Taxes</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Currency Code"
                  value={formData.currency}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currency: text }))}
                  placeholder="USD"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Symbol"
                  value={formData.currencyFormat}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currencyFormat: text }))}
                  placeholder="$"
                />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Enable Tax Collection</Text>
              <Switch
                value={formData.taxEnabled}
                onValueChange={(val) => setFormData(prev => ({ ...prev, taxEnabled: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            
            {formData.taxEnabled && (
              <Input
                label="Global Tax Rate (%)"
                value={formData.taxRate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, taxRate: text }))}
                keyboardType="numeric"
              />
            )}
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Payment Gateways</Text>
            <Input
              label="Stripe Public Key"
              value={formData.stripePublic}
              onChangeText={(text) => setFormData(prev => ({ ...prev, stripePublic: text }))}
              autoCapitalize="none"
            />
            <View className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <Text className="text-[13px] text-orange-800">
                To update your Secret Key, please use the desktop admin dashboard for security purposes.
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Email Server (SMTP)</Text>
            <Input
              label="SMTP Host"
              value={formData.smtpHost}
              onChangeText={(text) => setFormData(prev => ({ ...prev, smtpHost: text }))}
              autoCapitalize="none"
            />
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
