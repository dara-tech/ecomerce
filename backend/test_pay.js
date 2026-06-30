import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const update = async () => {
  const order = await Order.findOne({ isPaid: false });
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: "test",
      status: "COMPLETED",
      update_time: new Date().toISOString(),
      email_address: "test@example.com",
    };
    await order.save();
    console.log("Updated order", order._id);
  } else {
    console.log("No unpaid orders found");
  }
  process.exit();
};
update();
