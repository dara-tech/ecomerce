import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function PayoutsScreen() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayouts = async () => {
    try {
      const { data } = await api.get('/payouts');
      setPayouts(data || []);
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayouts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayouts();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'text-green-600 dark:text-green-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      default: return 'text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          title: 'Payouts',
          headerShown: true,
          headerShadowVisible: false,
          headerBackTitle: 'Menu',
        }} 
      />
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {payouts.length > 0 ? (
            <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              {payouts.map((item, index) => {
                const isLast = index === payouts.length - 1;
                return (
                  <View 
                    key={item._id}
                    className={`p-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mr-3">
                          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </View>
                        <View>
                          <Text className="text-gray-900 dark:text-white font-semibold">
                            ${item.amount?.toFixed(2) || '0.00'}
                          </Text>
                          <Text className="text-gray-500 dark:text-gray-400 text-xs">
                            {item.vendor?.name || 'Unknown Vendor'}
                          </Text>
                        </View>
                      </View>
                      <View className={`flex-row items-center px-2 py-1 rounded-full ${
                        item.status === 'paid' ? 'bg-green-100 dark:bg-green-900/20' : 
                        item.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-amber-100 dark:bg-amber-900/20'
                      }`}>
                        <Text className={`text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                          {item.status || 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                      <Text className="text-gray-500 dark:text-gray-400 text-xs">
                        Method: {item.method || 'Bank Transfer'}
                      </Text>
                      <Text className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center py-10">
              <DollarSign size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                No payout requests found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
