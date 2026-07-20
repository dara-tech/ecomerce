import { View, Text } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { Stack } from 'expo-router';

export default function ReturnsScreen() {
  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Returns',
          headerBackTitle: 'Menu',
        }} 
      />

      <View className="flex-1 items-center justify-center p-8">
        <View className="w-20 h-20 bg-rose-50 rounded-full items-center justify-center mb-6">
          <RotateCcw size={40} color="#F43F5E" />
        </View>
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Returns Yet</Text>
        <Text className="text-[15px] text-system-gray dark:text-gray-400 text-center leading-6">
          When customers request a return or exchange, it will appear here for you to review and process.
        </Text>
      </View>
    </View>
  );
}
