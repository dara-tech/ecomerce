import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl bg-white dark:bg-gray-900 p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
