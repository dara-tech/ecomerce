import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Package, FolderTree, Bookmark, 
  ShoppingCart, Truck, Warehouse, CreditCard, RotateCcw, Ticket,
  Users, Star, Heart,
  Megaphone, Mail, Bell, Image as ImageIcon, MessageSquare, Zap,
  FileText, FileBox, HelpCircle,
  BellRing, BarChart3,
  Settings, Shield, LogOut,
  ChevronRight, LucideIcon, Store, DollarSign, MessageCircle
} from 'lucide-react-native';
import { useAuth } from '../../src/store/auth';

type MenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
  bgColor: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Catalog',
    items: [
      { name: 'Products', icon: Package, path: '/(tabs)/products', bgColor: 'bg-indigo-500' },
      { name: 'Categories', icon: FolderTree, path: '/categories', bgColor: 'bg-blue-500' },
      { name: 'Brands', icon: Bookmark, path: '/brands', bgColor: 'bg-purple-500' },
    ]
  },
  {
    title: 'Store',
    items: [
      { name: 'Orders', icon: ShoppingCart, path: '/(tabs)/orders', bgColor: 'bg-green-500' },
      { name: 'Shipping', icon: Truck, path: '/shipping', bgColor: 'bg-sky-500' },
      { name: 'Inventory', icon: Warehouse, path: '/inventory', bgColor: 'bg-emerald-500' },
      { name: 'Payments', icon: CreditCard, path: '/payments', bgColor: 'bg-amber-500' },
      { name: 'Returns', icon: RotateCcw, path: '/returns', bgColor: 'bg-rose-500' },
      { name: 'Coupons', icon: Ticket, path: '/coupons', bgColor: 'bg-orange-500' },
      { name: 'Payouts', icon: DollarSign, path: '/payouts', bgColor: 'bg-emerald-600' },
    ]
  },
  {
    title: 'Customers',
    items: [
      { name: 'Users', icon: Users, path: '/users', bgColor: 'bg-cyan-500' },
      { name: 'Reviews', icon: Star, path: '/reviews', bgColor: 'bg-yellow-400' },
      { name: 'Wishlists', icon: Heart, path: '/wishlists', bgColor: 'bg-pink-500' },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { name: 'Email Campaigns', icon: Mail, path: '/emails', bgColor: 'bg-violet-500' },
      { name: 'Push Notifications', icon: Bell, path: '/push', bgColor: 'bg-red-500' },
      { name: 'Banners', icon: ImageIcon, path: '/banners', bgColor: 'bg-fuchsia-500' },
      { name: 'Popups', icon: MessageSquare, path: '/popups', bgColor: 'bg-teal-500' },
      { name: 'Flash Sales', icon: Zap, path: '/flash-sales', bgColor: 'bg-yellow-500' },
    ]
  },
  {
    title: 'Content',
    items: [
      { name: 'Pages', icon: FileBox, path: '/pages', bgColor: 'bg-blue-400' },
      { name: 'FAQs', icon: HelpCircle, path: '/faqs', bgColor: 'bg-slate-500' },
      { name: 'Blogs', icon: FileText, path: '/blogs', bgColor: 'bg-indigo-400' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Notifications', icon: BellRing, path: '/notifications', bgColor: 'bg-red-500' },
      { name: 'Reports', icon: BarChart3, path: '/reports', bgColor: 'bg-blue-600' },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Stores', icon: Store, path: '/stores', bgColor: 'bg-indigo-500' },
      { name: 'Settings', icon: Settings, path: '/settings', bgColor: 'bg-gray-800' },
      { name: 'Security', icon: Shield, path: '/security', bgColor: 'bg-emerald-600' },
    ]
  }
];

export default function MenuScreen() {
  const logout = useAuth((state) => state.logout);
  const user = useAuth((state) => state.user);

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <ScrollView 
        className="flex-1 bg-transparent"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
      <View className="px-4 pt-6 pb-2 mb-2">
        <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] p-5 border border-gray-200 dark:border-gray-800 flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-system-blue/10 dark:bg-white/10 items-center justify-center mr-4">
            <Text className="text-xl font-bold text-system-blue dark:text-white">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'Admin User'}</Text>
            <Text className="text-[15px] text-system-gray dark:text-gray-400">{user?.email || 'admin@example.com'}</Text>
          </View>
        </View>
      </View>

      {MENU_SECTIONS.map((section) => (
        <View key={section.title} className="mb-6 px-4">
          <Text className="ml-2 mb-2 text-[13px] font-semibold text-system-gray dark:text-gray-400 uppercase tracking-wider">
            {section.title}
          </Text>
          <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
            {section.items.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === section.items.length - 1;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => router.push(item.path as any)}
                  className="bg-white dark:bg-[#0A0A0A] flex-row items-center pl-4 active:bg-gray-50 dark:active:bg-gray-800"
                >
                  <View className={`w-8 h-8 rounded-full mr-4 items-center justify-center ${item.bgColor}`}>
                    <Icon size={18} color="#FFFFFF" />
                  </View>
                  
                  <View className={`flex-1 flex-row items-center justify-between py-3.5 pr-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                    <Text className="text-[17px] text-gray-900 dark:text-white">{item.name}</Text>
                    <ChevronRight size={20} color="#C7C7CC" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View className="mt-4 mb-8 px-4">
        <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
          <TouchableOpacity
            onPress={logout}
            className="bg-white dark:bg-[#0A0A0A] py-4 active:bg-gray-50 dark:active:bg-gray-800 flex-row items-center justify-center"
          >
            <Text className="text-[17px] font-semibold text-red-500">Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
