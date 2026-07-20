import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { TrendingUp, DollarSign, ShoppingBag, Truck, Package, Calendar } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function ReportsScreen() {
  const [salesData, setSalesData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year', 'all'

  const fetchReports = async () => {
    try {
      let query = '';
      if (timeframe !== 'all') {
        const d = new Date();
        if (timeframe === 'week') d.setDate(d.getDate() - 7);
        if (timeframe === 'month') d.setMonth(d.getMonth() - 1);
        if (timeframe === 'year') d.setFullYear(d.getFullYear() - 1);
        query = `?from=${d.toISOString()}`;
      }

      const [salesRes, prodRes] = await Promise.all([
        api.get(`/ops/reports${query ? query + '&' : '?'}type=sales`),
        api.get(`/ops/reports${query ? query + '&' : '?'}type=products`),
      ]);

      setSalesData(salesRes.data);
      setProductsData(prodRes.data.products || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [timeframe])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [timeframe]);

  const StatRow = ({ title, value, icon: Icon, color, format = 'currency', isLast = false }: any) => {
    const formattedValue = format === 'currency' 
      ? `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : value?.toLocaleString() || '0';

    return (
      <View className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}15` }}>
            <Icon size={20} color={color} />
          </View>
          <Text className="text-[16px] font-medium text-gray-900 dark:text-white">{title}</Text>
        </View>
        <Text className="text-[18px] font-bold text-gray-900 dark:text-white">{formattedValue}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Reports & Analytics',
          headerBackTitle: 'Menu',
        }} 
      />

      <View className="px-4 py-3 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-gray-800 flex-row items-center">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {['week', 'month', 'year', 'all'].map(tf => (
            <TouchableOpacity
              key={tf}
              onPress={() => { setLoading(true); setTimeframe(tf); }}
              className={`px-4 py-2 rounded-full mr-2 ${timeframe === tf ? 'bg-system-blue dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              <Text className={`font-semibold text-[13px] ${timeframe === tf ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {tf === 'all' ? 'All Time' : `Past ${tf.charAt(0).toUpperCase() + tf.slice(1)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ padding: 10, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text className="px-2 pt-2 pb-1 text-[18px] font-bold text-gray-900 dark:text-white mb-2">Sales Overview</Text>
          
          <View className="bg-white dark:bg-[#0A0A0A] rounded-3xl px-5 border border-gray-200 dark:border-gray-800 mt-2">
            <StatRow 
              title="Total Revenue" 
              value={salesData?.revenue} 
              icon={TrendingUp} 
              color="#10B981" 
            />
            <StatRow 
              title="Total Orders" 
              value={salesData?.orders} 
              icon={ShoppingBag} 
              color="#3B82F6" 
              format="number"
            />
            <StatRow 
              title="Tax Collected" 
              value={salesData?.tax} 
              icon={DollarSign} 
              color="#F59E0B" 
            />
            <StatRow 
              title="Shipping Fees" 
              value={salesData?.shipping} 
              icon={Truck} 
              color="#8B5CF6" 
              isLast={true}
            />
          </View>

          <View className="mt-8 px-2">
            <Text className="text-[18px] font-bold text-gray-900 dark:text-white mb-4">Top Selling Products</Text>
            
            <View className="mt-2 bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              {productsData.length > 0 ? productsData.map((prod, idx) => {
                const isLast = idx === productsData.length - 1;
                return (
                  <View 
                    key={prod._id} 
                    className={`p-4 flex-row items-center ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <View className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-gray-800 items-center justify-center mr-4 border border-blue-100 dark:border-gray-700">
                      <Text className="font-bold text-system-blue dark:text-white text-[15px]">#{idx + 1}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{prod.name}</Text>
                      <Text className="text-[13px] text-system-gray dark:text-gray-400">
                        {prod.sold} units sold
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-[15px] text-gray-900 dark:text-white">
                        ${((prod.sold || 0) * (prod.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text className="text-[11px] text-system-gray dark:text-gray-400 mt-1">Revenue</Text>
                    </View>
                  </View>
                );
              }) : (
                <View className="items-center py-10">
                  <Text className="text-system-gray dark:text-gray-400 text-[15px]">No products data available.</Text>
                </View>
              )}
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
}
