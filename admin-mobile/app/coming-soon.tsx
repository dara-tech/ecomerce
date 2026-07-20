import { View, Text } from 'react-native';
import { Hammer } from 'lucide-react-native';

export default function ComingSoonScreen() {
  return (
    <View className="flex-1 bg-transparent items-center justify-center p-6">
      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
        <Hammer size={40} color="#007AFF" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Coming Soon
      </Text>
      <Text className="text-[17px] text-system-gray dark:text-gray-400 text-center max-w-[280px]">
        This feature is currently in development and will be available in a future update.
      </Text>
    </View>
  );
}
