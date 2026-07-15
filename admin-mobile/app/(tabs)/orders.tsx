import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Package, ChevronRight } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../src/lib/api';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterModal, FilterSection } from '../../src/components/ui/FilterModal';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  // Local filter & sort
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by Keyword
    if (keyword) {
      const lower = keyword.toLowerCase();
      result = result.filter(o => 
        o._id?.toLowerCase().includes(lower) || 
        o.user?.name?.toLowerCase().includes(lower) ||
        o.status?.toLowerCase().includes(lower)
      );
    }
    
    // Filter by Status
    if (status !== 'all') {
      result = result.filter(o => o.status?.toLowerCase() === status);
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, keyword, status, sort]);

  const handleApplyFilters = () => {
    setIsFilterVisible(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'pending': return 'text-orange-500';
      case 'processing': return 'text-system-blue dark:text-white';
      case 'shipped': return 'text-purple-500';
      case 'delivered': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-system-gray dark:text-gray-400';
    }
  };

  const formatMoney = (val: number) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
  ];

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">

      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyFilters}
      >
        <FilterSection 
          title="Status" 
          options={statusOptions} 
          selectedValue={status} 
          onSelect={setStatus} 
        />
        <FilterSection 
          title="Sort By Date" 
          options={sortOptions} 
          selectedValue={sort} 
          onSelect={setSort} 
        />
      </FilterModal>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={() => (
            <View className="mb-2">
              <SearchBar 
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Search by ID, name, or status..."
                onFilterPress={() => setIsFilterVisible(true)}
              />
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable 
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-gray-800 items-center justify-center mr-4 border border-blue-100 dark:border-gray-700">
                  <Package size={24} color="#007AFF" />
                </View>
                <View>
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-0.5">{item.user?.name || 'Guest'}</Text>
                  <Text className="text-[13px] font-medium text-system-gray dark:text-gray-400">#{item._id?.slice(-6).toUpperCase()}</Text>
                </View>
              </View>
              <View className="items-end mr-2">
                <Text className="font-bold text-[17px] text-gray-900 dark:text-white mb-0.5">{formatMoney(item.totalPrice)}</Text>
                <View className="flex-row items-center space-x-1">
                  <Text className={`text-[13px] font-semibold ${getStatusColor(item.status)} uppercase`}>{item.status || 'Pending'}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#C7C7CC" />
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No orders found matching filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
