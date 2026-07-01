import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';

export const getWishlist = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).populate('product');
  res.json(items.map((i) => i.product).filter(Boolean));
};

export const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId required' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await Wishlist.findOneAndUpdate(
    { user: req.user._id, product: productId },
    { user: req.user._id, product: productId },
    { upsert: true, new: true }
  );
  res.status(201).json({ message: 'Added to wishlist' });
};

export const removeFromWishlist = async (req, res) => {
  await Wishlist.findOneAndDelete({ user: req.user._id, product: req.params.productId });
  res.json({ message: 'Removed from wishlist' });
};

export const getWallet = async (req, res) => {
  const user = await User.findById(req.user._id);
  const transactions = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({
    balance: user.walletBalance,
    loyaltyPoints: user.loyaltyPoints,
    transactions,
  });
};

export const topUpWallet = async (req, res) => {
  const amount = parseFloat(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const user = await User.findById(req.user._id);
  user.walletBalance += amount;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    type: 'credit',
    amount,
    description: 'Wallet top-up',
  });

  res.json({ balance: user.walletBalance, loyaltyPoints: user.loyaltyPoints });
};

export const redeemLoyaltyPoints = async (req, res) => {
  const points = parseInt(req.body.points, 10);
  if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points' });

  const user = await User.findById(req.user._id);
  if (user.loyaltyPoints < points) {
    return res.status(400).json({ message: 'Insufficient loyalty points' });
  }

  const credit = points / 100;
  user.loyaltyPoints -= points;
  user.walletBalance += credit;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    type: 'loyalty_redeem',
    amount: credit,
    points,
    description: `Redeemed ${points} points`,
  });

  res.json({ balance: user.walletBalance, loyaltyPoints: user.loyaltyPoints });
};

export const getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const exclude = new Set(
      String(req.query.exclude || '')
        .split(',')
        .filter(Boolean)
    );
    let query = { countInStock: { $gt: 0 } };

    if (productId && productId !== 'home') {
      exclude.add(productId);
      const product = await Product.findById(productId);
      if (product) {
        query = {
          countInStock: { $gt: 0 },
          $or: [{ category: product.category }, { brand: product.brand }],
        };
      }
    }

    if (exclude.size) {
      query._id = { $nin: [...exclude] };
    }

    const products = await Product.find(query)
      .sort({ rating: -1, numReviews: -1, createdAt: -1 })
      .limit(8);

    if (products.length < 4) {
      const extra = await Product.find({
        countInStock: { $gt: 0 },
        _id: { $nin: [...products.map((p) => p._id), ...exclude] },
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(8);
      const ids = new Set(products.map((p) => String(p._id)));
      extra.forEach((p) => {
        if (!ids.has(String(p._id)) && products.length < 8) products.push(p);
      });
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getCartRecommendations = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .filter(Boolean);
    const excludeIds = [...ids];

    const cartProducts = ids.length
      ? await Product.find({ _id: { $in: ids } }).select('category brand name')
      : [];

    const categories = [...new Set(cartProducts.map((p) => p.category).filter(Boolean))];
    const brands = [...new Set(cartProducts.map((p) => p.brand).filter(Boolean))];

    const inStock = { countInStock: { $gt: 0 } };
    const notInCart = { _id: { $nin: excludeIds } };

    const pairsWell =
      categories.length > 0
        ? await Product.find({
            ...inStock,
            ...notInCart,
            category: { $in: categories },
          })
            .sort({ rating: -1, numReviews: -1 })
            .limit(6)
        : [];

    pairsWell.forEach((p) => excludeIds.push(String(p._id)));

    const sameBrand =
      brands.length > 0
        ? await Product.find({
            ...inStock,
            _id: { $nin: excludeIds },
            brand: { $in: brands },
          })
            .sort({ rating: -1, createdAt: -1 })
            .limit(6)
        : [];

    sameBrand.forEach((p) => excludeIds.push(String(p._id)));

    const crossSell = await Product.find({
      ...inStock,
      _id: { $nin: excludeIds },
      ...(categories.length ? { category: { $nin: categories } } : {}),
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(6);

    crossSell.forEach((p) => excludeIds.push(String(p._id)));

    const trending = await Product.find({
      ...inStock,
      _id: { $nin: excludeIds },
    })
      .sort({ rating: -1, numReviews: -1, createdAt: -1 })
      .limit(8);

    res.json({
      pairsWell,
      sameBrand,
      crossSell,
      trending,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
