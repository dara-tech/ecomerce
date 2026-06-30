import Product from '../models/Product.js';

export async function validateOrderStock(orderItems) {
  if (!orderItems?.length) {
    return { ok: false, message: 'No order items' };
  }

  for (const item of orderItems) {
    const productId = item.product || item._id;
    const product = await Product.findById(productId);

    if (!product) {
      return { ok: false, message: `Product not found: ${item.name}` };
    }

    if (product.countInStock < item.qty) {
      return {
        ok: false,
        message: `Insufficient stock for "${product.name}". Only ${product.countInStock} available.`,
      };
    }
  }

  return { ok: true };
}

export async function fulfillOrderStock(order) {
  if (order.stockDeducted) {
    return { ok: true, alreadyFulfilled: true };
  }

  for (const item of order.orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, countInStock: { $gte: item.qty } },
      { $inc: { countInStock: -item.qty } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      const product = await Product.findById(item.product);
      return {
        ok: false,
        message: product
          ? `Insufficient stock for "${product.name}". Only ${product.countInStock} available.`
          : `Product not found: ${item.name}`,
      };
    }
  }

  order.stockDeducted = true;
  await order.save();
  return { ok: true };
}
