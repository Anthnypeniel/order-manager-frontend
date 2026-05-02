// App-wide config — one place to update when going live
const config = {
  paystackPublicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
};

export default config;
