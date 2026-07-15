import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './components/ui/Loading';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Users from './pages/Users';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Security from './pages/Security';
import Pages from './pages/cms/Pages';
import Faqs from './pages/cms/Faqs';
import Blogs from './pages/cms/Blogs';
import EmailCampaigns from './pages/marketing/EmailCampaigns';
import PushNotifications from './pages/marketing/PushNotifications';
import BannerManagement from './pages/marketing/BannerManagement';
import Popups from './pages/marketing/Popups';
import FlashSales from './pages/marketing/FlashSales';
import LiveChat from './pages/LiveChat';
import Shipping from './pages/Shipping';
import Inventory from './pages/Inventory';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Stores from './pages/Stores';
import Wishlists from './pages/Wishlists';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Returns from './pages/Returns';
import Payouts from './pages/Payouts';
import MyStore from './pages/MyStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loading variant="inline" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'customer') {
    return <Navigate to="/login" replace state={{ message: 'Admin access required' }} />;
  }
  
  return <>{children}</>;
};

// Admin-only Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="orders" element={<Orders />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="wishlists" element={<Wishlists />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="stores" element={<Stores />} />
            <Route path="my-store" element={<MyStore />} />
            <Route path="live-chat" element={<LiveChat />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="returns" element={<Returns />} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="security" element={<Security />} />
            <Route path="marketing/email-campaigns" element={<EmailCampaigns />} />
            <Route path="marketing/push-notifications" element={<PushNotifications />} />
            <Route path="marketing/banners" element={<BannerManagement />} />
            <Route path="marketing/popups" element={<Popups />} />
            <Route path="marketing/flash-sales" element={<FlashSales />} />
            <Route path="cms/banners" element={<Navigate to="/marketing/banners" replace />} />
            <Route path="cms/pages" element={<Pages />} />
            <Route path="cms/faqs" element={<Faqs />} />
            <Route path="cms/blogs" element={<Blogs />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
