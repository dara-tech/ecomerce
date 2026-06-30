import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
const bakongAccount = "cheol_sovandara@bkrt";
const totalPrice = 557.1940000000001;
const optionalData = {
  currency: khqrData.currency.usd,
  amount: Number(Number(totalPrice).toFixed(2)),
  mobileNumber: "85512345678",
  storeLabel: "Modern E-Commerce",
  terminalLabel: "Online Checkout",
  purposeOfTransaction: "Order 1c8b4567",
  languagePreference: "km",
  merchantNameAlternateLanguage: "Modern E-Commerce",
  merchantCityAlternateLanguage: "Phnom Penh",
  expirationTimestamp: Date.now() + 60 * 60 * 1000,
};
const individualInfo = new IndividualInfo(
  bakongAccount,
  "Modern E-Commerce",
  "Phnom Penh",
  optionalData
);
const khqr = new BakongKHQR();
const qrPayload = khqr.generateIndividual(individualInfo);
console.log(JSON.stringify(qrPayload, null, 2));
