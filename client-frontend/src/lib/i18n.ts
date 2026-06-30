export type Locale = 'en' | 'km';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'km', label: 'ខ្មែរ' },
];

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  KHR: 4100,
  EUR: 0.92,
};

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home',
    products: 'Products',
    categories: 'Categories',
    cart: 'Cart',
    wishlist: 'Wishlist',
    compare: 'Compare',
    wallet: 'Wallet',
    orders: 'Orders',
    signIn: 'Sign In',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    outOfStock: 'Out of Stock',
    recentlyViewed: 'Recently Viewed',
    recommended: 'Recommended for You',
    trackOrder: 'Track Order',
    loyaltyPoints: 'Loyalty Points',
    walletBalance: 'Wallet Balance',
    liveChat: 'Live Chat',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
  },
  km: {
    home: 'ទំព័រដើម',
    products: 'ផលិតផល',
    categories: 'ប្រភេទ',
    cart: 'កន្ត្រក',
    wishlist: 'បញ្ជីចង់បាន',
    compare: 'ប្រៀបធៀប',
    wallet: 'កាបូប',
    orders: 'ការបញ្ជាទិញ',
    signIn: 'ចូល',
    addToCart: 'បន្ថែមកន្ត្រក',
    buyNow: 'ទិញភ្លាម',
    outOfStock: 'អស់ពេញ',
    recentlyViewed: 'បានមើលថ្មីៗ',
    recommended: 'ណែនាំសម្រាប់អ្នក',
    trackOrder: 'តាមដានការបញ្ជាទិញ',
    loyaltyPoints: 'ពិន្ទុស្ម័គ្រចិត្ត',
    walletBalance: 'សានសាកកាបូប',
    liveChat: 'ជជែកផ្ទាល់',
    darkMode: 'របៀបងងឹត',
    lightMode: 'របៀបភ្លឺ',
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}
