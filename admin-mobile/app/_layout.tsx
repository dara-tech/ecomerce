import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../src/store/auth';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Appearance, View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useFonts, GoogleSans_400Regular, GoogleSans_500Medium, GoogleSans_700Bold } from '@expo-google-fonts/google-sans';

const { width, height } = Dimensions.get('window');

import '../global.css';

export default function RootLayout() {
  const { checkAuth, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();
  
  const [fontsLoaded] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_700Bold,
  });

  useEffect(() => {
    checkAuth();
    // Force dark mode by default when app loads, persist preference
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem('app_theme').then((theme) => {
        if (!theme) {
          setColorScheme('dark');
          if (Appearance.setColorScheme) Appearance.setColorScheme('dark');
          AsyncStorage.setItem('app_theme', 'dark');
        } else if (theme === 'dark' || theme === 'light') {
          setColorScheme(theme);
          if (Appearance.setColorScheme) Appearance.setColorScheme(theme);
        }
        setThemeLoaded(true);
      });
    });
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    
    // Simulate a tiny delay for splash screen if needed, though expo-router handles most of it.
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
  }, [user, isLoading, segments, fontsLoaded]);

  if (!isReady || isLoading || !themeLoaded || !fontsLoaded) {
    return null; // Return null to prevent flicker before routing happens
  }

  const isDark = colorScheme === 'dark';

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: 'transparent' }
  };
  
  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: 'transparent' }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0B0815' : '#F8F9FE' }}>
      {/* Decorative Background Elements */}
      <View style={[styles.blob1, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.blob2, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' }]} />
      <BlurView intensity={isDark ? 100 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

      <ThemeProvider value={isDark ? CustomDarkTheme : CustomDefaultTheme}>
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: 'transparent' },
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: isDark ? '#FFFFFF' : '#111827',
            headerShadowVisible: false,
          }}
        >
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
    </View>
  );
}

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 999,
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 999,
  }
});
