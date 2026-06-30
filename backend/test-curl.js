import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
const token = jwt.sign({ id: '64b1f6305a46e1001c8b4567' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
const data = {
  orderItems: [{ _id: "64b1f6305a46e1001c8b4567", name: "Test", price: 10, qty: 1 }],
  shippingAddress: { address: '1', city: '1', postalCode: '1', country: '1' },
  itemsPrice: 10, taxPrice: 1, shippingPrice: 0, totalPrice: 11
};
const cmd = `curl -X POST http://localhost:5001/api/payments/khqr/generate -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(data)}'`;
exec(cmd, (error, stdout, stderr) => {
  if (error) console.error(`exec error: ${error}`);
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
