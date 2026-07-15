import { useColorScheme } from 'nativewind';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowUpRight, Wallet, ArrowRightLeft, PieChart, ChevronRight, Download } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import api from '../../src/lib/api';

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-system-bg dark:bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const formatMoney = (val: number) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <ScrollView 
      className="flex-1 bg-system-bg dark:bg-black"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-4 pt-6 pb-24 gap-8">
        
        {/* Financial Header */}
        <View className="items-center">
          <Text className="text-[44px] font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            {formatMoney(stats?.totalRevenue)}
          </Text>
          <View className="flex-row items-center bg-green-100 px-3 py-1.5 rounded-full">
            <ArrowUpRight size={16} color="#34C759" />
            <Text className="text-[14px] font-bold text-green-600 ml-1">
              +{formatMoney(stats?.todayRevenue)} Today
            </Text>
          </View>
        </View>

        {/* Quick Actions (Financial Style) */}
        <View className="flex-row justify-center gap-8">
          <TouchableOpacity className="items-center">
            <View className="w-14 h-14 bg-gray-900 rounded-full items-center justify-center mb-2 shadow-sm shadow-gray-90 dark:shadow-none0/20">
              <Download size={24} color="#FFFFFF" />
            </View>
            <Text className="text-[13px] font-medium text-gray-900 dark:text-white">Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center">
            <View className="w-14 h-14 bg-white dark:bg-gray-900 rounded-full items-center justify-center mb-2 shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800">
              <ArrowRightLeft size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
            </View>
            <Text className="text-[13px] font-medium text-gray-900 dark:text-white">Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center">
            <View className="w-14 h-14 bg-white dark:bg-gray-900 rounded-full items-center justify-center mb-2 shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800">
              <PieChart size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
            </View>
            <Text className="text-[13px] font-medium text-gray-900 dark:text-white">Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Metrics */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800">
            <Text className="text-[13px] font-medium text-system-gray dark:text-gray-400 mb-1">Total Orders</Text>
            <Text className="text-[24px] font-bold text-gray-900 dark:text-white">{stats?.totalOrders?.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800">
            <Text className="text-[13px] font-medium text-system-gray dark:text-gray-400 mb-1">Avg Order</Text>
            <Text className="text-[24px] font-bold text-gray-900 dark:text-white">
              {stats?.totalOrders ? formatMoney(stats.totalRevenue / stats.totalOrders) : '$0.00'}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        <View>
          <View className="flex-row justify-between items-end mb-3 px-1">
            <Text className="text-[14px] font-bold text-system-gray dark:text-gray-400 uppercase tracking-wider">Transactions</Text>
            <TouchableOpacity>
              <Text className="text-[14px] font-semibold text-system-blue dark:text-white">See All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white dark:bg-gray-900 rounded-[24px] overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800">
            {stats?.recentOrders?.map((order: any, idx: number) => {
              const isLast = idx === stats.recentOrders.length - 1;
              return (
                <View key={order._id}>
                  <TouchableOpacity 
                    className={`flex-row items-center justify-between px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-full bg-gray-50 dark:bg-black items-center justify-center mr-4 border border-gray-100 dark:border-gray-800">
                        <Wallet size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-0.5" numberOfLines={1}>
                          {order.user?.name || 'Guest Checkout'}
                        </Text>
                        <Text className="text-[14px] text-system-gray dark:text-gray-400">#{order._id?.slice(-6).toUpperCase()}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-[17px] text-gray-900 dark:text-white mb-0.5">
                        +{formatMoney(order.totalPrice)}
                      </Text>
                      <Text className="text-[13px] font-medium text-green-500">Completed</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <View className="p-8 items-center">
                <Text className="text-system-gray dark:text-gray-400 text-[15px]">No recent transactions.</Text>
              </View>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
