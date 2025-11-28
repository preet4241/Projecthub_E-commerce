const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(express.static('public'));
app.use(express.json());

// Sample products data
const products = [
  { id: 1, name: 'Wireless Headphones', price: 4999, image: '🎧', category: 'Electronics' },
  { id: 2, name: 'Smart Watch', price: 8999, image: '⌚', category: 'Electronics' },
  { id: 3, name: 'USB-C Cable', price: 499, image: '🔌', category: 'Accessories' },
  { id: 4, name: 'Phone Case', price: 599, image: '📱', category: 'Accessories' },
  { id: 5, name: 'Laptop Stand', price: 1999, image: '💻', category: 'Office' },
  { id: 6, name: 'Webcam', price: 3499, image: '📹', category: 'Electronics' },
];

// API Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
