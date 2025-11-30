const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = 5000;

// ===== LOGGING UTILITY =====
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}${err ? ': ' + err.message : ''}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  api: (method, path, status, time) => console.log(`[API] ${new Date().toISOString()} - ${method} ${path} → ${status} (${time}ms)`)
};

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  
  res.json = function(data) {
    const duration = Date.now() - start;
    log.api(req.method, req.path, res.statusCode, duration);
    return originalJson.call(this, data);
  };
  next();
});

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
    
    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add customer info columns to orders if not exists
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS customer_address TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    
    log.info('✓ Database initialized successfully');
    log.info(`Tables created: projects, users, cart_items, orders, order_items, notifications`);
    client.release();
  } catch (error) {
    log.warn('Database setup note: ' + error.message);
    // Continue even if DB connection fails
  }
}

// API Routes - Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    log.info('Fetching all projects...');
    const result = await pool.query('SELECT * FROM projects ORDER BY id');
    log.info(`✓ Retrieved ${result.rows.length} projects`);
    res.json(result.rows);
  } catch (error) {
    log.error('Error fetching projects', error);
    res.json([]); // Return empty array if error
  }
});

// API Routes - Add new project
app.post('/api/projects', async (req, res) => {
  try {
    const { subject, college, topic, price, file } = req.body;
    log.info(`Adding new project: ${topic} (${subject}, ${college}) - ₹${price}`);
    const result = await pool.query(
      'INSERT INTO projects (subject, college, topic, price, file, downloads) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subject, college, topic, price, file || topic.toLowerCase().replace(/\s+/g, '-') + '.zip', 0]
    );
    log.info(`✓ Project created with ID: ${result.rows[0].id}`);
    res.json(result.rows[0]);
  } catch (error) {
    log.error('Error adding project', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// API Routes - Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log.info(`Deleting project ID: ${id}`);
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    log.info(`✓ Project ID ${id} deleted`);
    res.json({ success: true });
  } catch (error) {
    log.error('Error deleting project', error);
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
    log.info('Fetching cart items...');
    const result = await pool.query(`
      SELECT c.id, c.project_id, c.quantity, p.topic, p.price, p.subject, p.college
      FROM cart_items c
      JOIN projects p ON c.project_id = p.id
      ORDER BY c.created_at DESC
    `);
    log.info(`✓ Retrieved ${result.rows.length} cart items`);
    res.json(result.rows);
  } catch (error) {
    log.error('Error fetching cart', error);
    res.json([]);
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { project_id, quantity } = req.body;
    log.info(`Adding to cart - Project ID: ${project_id}, Quantity: ${quantity || 1}`);
    const result = await pool.query(
      'INSERT INTO cart_items (project_id, quantity) VALUES ($1, $2) RETURNING *',
      [project_id, quantity || 1]
    );
    log.info(`✓ Item added to cart with ID: ${result.rows[0].id}`);
    res.json(result.rows[0]);
  } catch (error) {
    log.error('Error adding to cart', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log.info(`Removing cart item ID: ${id}`);
    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    log.info(`✓ Cart item ID ${id} removed`);
    res.json({ success: true });
  } catch (error) {
    log.error('Error removing from cart', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Orders Routes - Get orders with optional status filter
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
      log.info(`Fetching orders with status: ${status}`);
    } else {
      log.info(`Fetching all orders`);
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    log.info(`✓ Retrieved ${result.rows.length} orders`);
    res.json(result.rows);
  } catch (error) {
    log.error('Error fetching orders', error);
    res.json([]);
  }
});

// Get order with items details
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const itemsResult = await pool.query(`
      SELECT oi.*, p.topic, p.subject, p.college 
      FROM order_items oi
      JOIN projects p ON oi.project_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get order statistics
app.get('/api/orders/stats/summary', async (req, res) => {
  try {
    const pending = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
    const confirmed = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'confirmed'");
    const cancelled = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'cancelled'");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'confirmed'");
    
    res.json({
      pending: parseInt(pending.rows[0].count),
      confirmed: parseInt(confirmed.rows[0].count),
      cancelled: parseInt(cancelled.rows[0].count),
      totalRevenue: parseInt(totalRevenue.rows[0].total)
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.json({ pending: 0, confirmed: 0, cancelled: 0, totalRevenue: 0 });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total_amount, customer_name, customer_email, customer_phone, customer_address, notes } = req.body;
    log.info(`Creating new order - Customer: ${customer_name || 'Guest'}, Amount: ₹${total_amount}, Items: ${items.length}`);
    
    const orderResult = await pool.query(
      `INSERT INTO orders (total_amount, status, customer_name, customer_email, customer_phone, customer_address, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [total_amount, 'pending', customer_name || 'Guest', customer_email || '', customer_phone || '', customer_address || '', notes || '']
    );
    const orderId = orderResult.rows[0].id;
    
    // Add items to order
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, project_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.project_id, item.quantity, item.price]
      );
    }
    
    // Create notification for new order
    await pool.query(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)',
      [`New Order #${orderId}`, `Order placed for ₹${total_amount}`, 'order']
    );
    
    log.info(`✓ Order #${orderId} created successfully with ${items.length} items`);
    res.json({ success: true, orderId, order: orderResult.rows[0] });
  } catch (error) {
    log.error('Error creating order', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    log.info(`Updating order #${id} status to: ${status}`);
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    // Create notification for status change
    const statusText = status === 'confirmed' ? 'confirmed' : status === 'cancelled' ? 'cancelled' : 'updated';
    await pool.query(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)',
      [`Order #${id} ${statusText}`, `Order status changed to ${status}`, 'order']
    );
    
    log.info(`✓ Order #${id} status updated to ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    log.error('Error updating order', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Notifications Routes
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json([]);
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const result = await pool.query(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3) RETURNING *',
      [title, message, type || 'info']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    log.info(`Admin login attempt - Username: ${username}`);
    // Simple auth - in production use proper authentication
    if (username === 'admin' && password === 'admin123') {
      log.info(`✓ Admin login successful`);
      res.json({ success: true, token: 'admin-token-' + Date.now() });
    } else {
      log.warn(`⚠️ Failed admin login attempt - Invalid credentials for user: ${username}`);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    log.error('Login error', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    log.info('═══════════════════════════════════════════════════');
    log.info(`✓ PROJECT MARKETPLACE RUNNING`);
    log.info(`🌐 Server: http://0.0.0.0:${PORT}`);
    log.info(`📊 Database: Ready for PostgreSQL connection`);
    log.info(`🛡️  Admin Login: admin / admin123`);
    log.info('═══════════════════════════════════════════════════');
  });
});
