import jwt from 'jsonwebtoken';

async function test() {
  try {
    const token = jwt.sign({ id: '64b1f6305a46e1001c8b4567' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
    
    const orderData = {
      orderItems: [{ _id: "64b1f6305a46e1001c8b4567", name: "Test", price: 10, qty: 1 }],
      shippingAddress: {
        address: '123 Prototype Street',
        city: 'Phnom Penh',
        postalCode: '12000',
        country: 'Cambodia'
      },
      itemsPrice: 10,
      taxPrice: 1,
      shippingPrice: 0,
      totalPrice: 11,
    };
    
    const res = await fetch('http://localhost:5001/api/payments/khqr/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    console.log(res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
