import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import RefundRequest from '../models/RefundRequest.js';
import { Coupon } from '../models/OpsModels.js';

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [usersCount, productsCount, ordersCount, allOrders, lowStockCount, pendingRefunds, activeCoupons] =
    await Promise.all([
    User.countDocuments({}),
    Product.countDocuments({}),
    Order.countDocuments({}),
    Order.find({}).sort({ createdAt: -1 }).populate('user', 'id name email'),
    Product.countDocuments({ countInStock: { $lte: 5 } }),
    RefundRequest.countDocuments({ status: 'pending' }),
    Coupon.countDocuments({ isActive: true }),
  ]);

  const paidOrders = allOrders.filter((order) => order.isPaid);
  const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);

  const todayOrders = allOrders.filter(
    (o) => new Date(o.createdAt) >= startOfToday && new Date(o.createdAt) < endOfToday
  );
  const todayRevenue = paidOrders
    .filter((o) => o.paidAt && new Date(o.paidAt) >= startOfToday && new Date(o.paidAt) < endOfToday)
    .reduce((acc, o) => acc + o.totalPrice, 0);

  const pendingOrders = allOrders.filter(
    (o) => !o.status || o.status === 'pending' || o.status === 'processing'
  ).length;
  const unpaidOrders = allOrders.filter((o) => !o.isPaid).length;

  const statusBreakdown = allOrders.reduce((acc, order) => {
    const key = order.status || 'pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const recentOrders = allOrders.slice(0, 8);

  const productSales = {};
  for (const order of paidOrders) {
    for (const item of order.orderItems || []) {
      const id = String(item.product);
      if (!productSales[id]) productSales[id] = { name: item.name, qty: 0, revenue: 0 };
      productSales[id].qty += item.qty;
      productSales[id].revenue += item.price * item.qty;
    }
  }
  const bestSellers = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const avgOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const salesData = last7Days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayOrders = paidOrders.filter(
      (o) => o.paidAt && new Date(o.paidAt) >= date && new Date(o.paidAt) < nextDate
    );

    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: dayOrders.reduce((acc, o) => acc + o.totalPrice, 0),
      orders: dayOrders.length,
    };
  });

  res.json({
    totalUsers: usersCount,
    totalProducts: productsCount,
    totalOrders: ordersCount,
    totalRevenue,
    todayRevenue,
    todayOrders: todayOrders.length,
    pendingOrders,
    unpaidOrders,
    lowStockCount,
    pendingRefunds,
    activeCoupons,
    avgOrderValue,
    bestSellers,
    statusBreakdown,
    recentOrders,
    salesData,
  });
};
