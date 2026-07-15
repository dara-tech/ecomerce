import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../src/store/auth';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Appearance } from 'react-native';

import '../global.css';

export default function RootLayout() {
  const { checkAuth, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    checkAuth();
    // Force dark mode by default when app loads, persist preference
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem('app_theme').then((theme) => {
        if (!theme) {
          setColorScheme('dark');
          Appearance.setColorScheme('dark');
          AsyncStorage.setItem('app_theme', 'dark');
        } else if (theme === 'dark' || theme === 'light') {
          setColorScheme(theme);
          Appearance.setColorScheme(theme);
        }
        setThemeLoaded(true);
      });
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    // Slight delay ensures Stack is fully mounted before replacing route
    const timeout = setTimeout(() => {
      const inAuthGroup = segments[0] === '(tabs)';
      
      if (!user && inAuthGroup) {
        router.replace('/');
      } else if (user && (!segments[0] || segments[0] === 'index')) {
        router.replace('/(tabs)/dashboard');
      }
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, [user, isLoading, segments]);

  if (!isReady || isLoading || !themeLoaded) {
    return null; // Return null to prevent flicker before routing happens
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="category-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="brand-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="user-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="shipping" />
      <Stack.Screen name="shipping-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="inventory-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="coupon-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="review-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wishlists" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="returns" />
      <Stack.Screen name="emails" />
      <Stack.Screen name="email-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="push" />
      <Stack.Screen name="push-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="banners" />
      <Stack.Screen name="banner-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="popups" />
      <Stack.Screen name="popup-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="flash-sales" />
      <Stack.Screen name="flash-sale-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="pages" />
      <Stack.Screen name="page-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="faqs" />
      <Stack.Screen name="faq-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="blogs" />
      <Stack.Screen name="blog-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="security" />
      <Stack.Screen name="coming-soon" options={{ headerShown: true, title: 'In Development', headerBackTitle: 'Back' }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="brands" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </Stack>
    </ThemeProvider>
  );
}
