const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = 5000;

app.use(express.static('public'));
app.use(express.json());

// PostgreSQL Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projecthub'
});

// Database initialization
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create projects table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(100) NOT NULL,
        college VARCHAR(100) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        file VARCHAR(255),
        downloads INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        college VARCHAR(100),
        is_banned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create cart items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        total_amount INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        price INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✓ Database initialized');
    client.release();
  } catch (error) {
    console.log('⚠️ Database setup note:', error.message);
    // Continue even if DB connection fails
  }
}

// API Routes - Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.json([]); // Return empty array if error
  }
});

// API Routes - Add new project
app.post('/api/projects', async (req, res) => {
  try {
    const { subject, college, topic, price, file } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (subject, college, topic, price, file, downloads) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subject, college, topic, price, file || topic.toLowerCase().replace(/\s+/g, '-') + '.zip', 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// API Routes - Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// API Routes - Get subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT subject FROM projects ORDER BY subject');
    res.json(result.rows.map(r => r.subject));
  } catch (error) {
    res.json([]);
  }
});

// API Routes - Get colleges
app.get('/api/colleges', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT college FROM projects ORDER BY college');
    res.json(result.rows.map(r => r.college));
  } catch (error) {
    res.json([]);
  }
});

// API Routes - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, first_name, last_name, email, college, created_at FROM users WHERE is_banned = FALSE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.json([]);
  }
});

// API Routes - Add new user
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, email, college } = req.body;
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, name, email, college) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, college, created_at',
      [first_name, last_name, `${first_name} ${last_name}`, email, college]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Cart Routes
app.get('/api/cart', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.project_id, c.quantity, p.topic, p.price, p.subject, p.college
      FROM cart_items c
      JOIN projects p ON c.project_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.json([]);
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { project_id, quantity } = req.body;
    const result = await pool.query(
      'INSERT INTO cart_items (project_id, quantity) VALUES ($1, $2) RETURNING *',
      [project_id, quantity || 1]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Orders Routes
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.json([]);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total_amount } = req.body;
    const orderResult = await pool.query(
      'INSERT INTO orders (total_amount, status) VALUES ($1, $2) RETURNING *',
      [total_amount, 'pending']
    );
    const orderId = orderResult.rows[0].id;
    
    // Add items to order
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, project_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.project_id, item.quantity, item.price]
      );
    }
    
    res.json({ success: true, orderId, order: orderResult.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Simple auth - in production use proper authentication
    if (username === 'admin' && password === 'admin123') {
      res.json({ success: true, token: 'admin-token-' + Date.now() });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Project Marketplace running at http://0.0.0.0:${PORT}`);
    console.log('📊 Ready for PostgreSQL database connection');
  });
});
