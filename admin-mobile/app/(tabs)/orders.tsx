import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, ChevronRight, Check, X, Trash2 } from 'lucide-react-native';
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

  // Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // Multi-select Handlers
  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string) => {
    if (selectionMode) {
      if (selectedIds.includes(id)) {
        const newIds = selectedIds.filter(i => i !== id);
        setSelectedIds(newIds);
        if (newIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      // Navigate to order details if needed
      console.log('Navigate to order', id);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Orders',
      `Are you sure you want to delete ${selectedIds.length} selected orders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedIds.map(id => api.delete(`/orders/${id}`)));
              setSelectionMode(false);
              setSelectedIds([]);
              fetchOrders();
            } catch (err) {
              console.error('Failed to delete orders', err);
            }
          }
        }
      ]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
      setSelectionMode(false);
    } else {
      setSelectedIds(filteredOrders.map(o => o._id));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
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
        <View className="flex-1 px-4 pb-4 pt-4">
          <View className="mb-4">
            {selectionMode ? (
              <View className="flex-row items-center justify-between bg-sky-50 dark:bg-sky-900/20 rounded-2xl px-4 py-3 border border-sky-100 dark:border-sky-800">
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedIds([]); }} className="mr-3 p-1">
                    <X size={24} color="#0EA5E9" />
                  </TouchableOpacity>
                  <Text className="text-[17px] font-bold text-sky-700 dark:text-sky-300">
                    {selectedIds.length} Selected
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={toggleSelectAll} className="mr-4 p-1">
                    <Text className="text-sky-600 dark:text-sky-400 font-medium">
                      {selectedIds.length === filteredOrders.length ? 'Deselect' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteSelected} className="p-1">
                    <Trash2 size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <SearchBar 
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Search by ID, name, or status..."
                onFilterPress={() => setIsFilterVisible(true)}
              />
            )}
          </View>
          
          {filteredOrders.length > 0 ? (
            <View className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              <FlatList
                data={filteredOrders}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item, index }) => {
                  const isLast = index === filteredOrders.length - 1;
                  const isSelected = selectedIds.includes(item._id);
                  
                  return (
                    <Pressable 
                      onLongPress={() => handleLongPress(item._id)}
                      onPress={() => handlePress(item._id)}
                      delayLongPress={200}
                      className={`flex-row items-center justify-between px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800 ${isSelected ? 'bg-sky-50 dark:bg-sky-900/10' : ''} ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                    >
                      <View className="flex-row items-center flex-1">
                        {selectionMode && (
                          <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <Check size={12} color="white" />}
                          </View>
                        )}
                        <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mr-4">
                          <Package size={24} color="#007AFF" />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="font-bold text-[17px] text-gray-900 dark:text-white mb-1">
                            #{item._id?.substring(0, 8).toUpperCase()}
                          </Text>
                          <Text className="text-[14px] text-system-gray dark:text-gray-400 mb-1" numberOfLines={1}>
                            {item.user?.name || 'Guest User'}
                          </Text>
                          <Text className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            ${(item.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="items-end justify-center">
                        <View className={`px-2 py-1 rounded text-xs mb-2 ${getStatusColor(item.status).split(' ')[0]}`}>
                          <Text className={`text-[11px] font-semibold ${getStatusColor(item.status).split(' ')[1]}`}>
                            {item.status?.toUpperCase() || 'PENDING'}
                          </Text>
                        </View>
                        {!selectionMode && <ChevronRight size={20} color="#C7C7CC" />}
                      </View>
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No orders found.</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
