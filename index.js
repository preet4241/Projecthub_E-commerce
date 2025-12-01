const express = require('express');
const db = require('./database');
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

// API Routes - Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    log.info('Fetching all projects...');
    const projects = await db.getAllProjects();
    log.info(`✓ Retrieved ${projects.length} projects`);
    res.json(projects);
  } catch (error) {
    log.error('Error fetching projects', error);
    res.json([]);
  }
});

// API Routes - Add new project
app.post('/api/projects', async (req, res) => {
  try {
    const { subject, college, topic, price, file, pages, description, packageincludes, primary_photo, other_photos } = req.body;
    log.info(`Adding new project: ${topic} (${subject}) - ₹${price}`);
    const project = await db.createProject({ subject, college, topic, price, file, pages, description, packageincludes, primary_photo, other_photos });
    log.info(`✓ Project created with ID: ${project.id}`);
    res.json(project);
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
    await db.deleteProject(id);
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
    const subjects = await db.getDistinctSubjects();
    res.json(subjects);
  } catch (error) {
    res.json([]);
  }
});

// API Routes - Get colleges
app.get('/api/colleges', async (req, res) => {
  try {
    const colleges = await db.getDistinctColleges();
    res.json(colleges);
  } catch (error) {
    res.json([]);
  }
});

// API Routes - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    log.error('Error fetching users', error);
    res.json([]);
  }
});

// API Routes - Add new user
app.post('/api/users', async (req, res) => {
  try {
    const user = await db.createUser(req.body);
    res.json(user);
  } catch (error) {
    log.error('Error adding user', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Cart Routes
app.get('/api/cart', async (req, res) => {
  try {
    log.info('Fetching cart items...');
    const items = await db.getCartItems();
    log.info(`✓ Retrieved ${items.length} cart items`);
    res.json(items);
  } catch (error) {
    log.error('Error fetching cart', error);
    res.json([]);
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { project_id, quantity } = req.body;
    log.info(`Adding to cart - Project ID: ${project_id}, Quantity: ${quantity || 1}`);
    const item = await db.addToCart(project_id, quantity);
    log.info(`✓ Item added to cart with ID: ${item.id}`);
    res.json(item);
  } catch (error) {
    log.error('Error adding to cart', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log.info(`Removing cart item ID: ${id}`);
    await db.removeFromCart(id);
    log.info(`✓ Cart item ID ${id} removed`);
    res.json({ success: true });
  } catch (error) {
    log.error('Error removing from cart', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Orders Routes
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    if (status) {
      log.info(`Fetching orders with status: ${status}`);
    } else {
      log.info(`Fetching all orders`);
    }
    const orders = await db.getAllOrders(status);
    log.info(`✓ Retrieved ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    log.error('Error fetching orders', error);
    res.json([]);
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    log.error('Error fetching order', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.get('/api/orders/stats/summary', async (req, res) => {
  try {
    const stats = await db.getOrderStats();
    res.json(stats);
  } catch (error) {
    log.error('Error fetching order stats', error);
    res.json({ pending: 0, confirmed: 0, cancelled: 0, totalRevenue: 0 });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total_amount, customer_name, customer_email, customer_phone, customer_address, notes } = req.body;
    log.info(`Creating new order - Customer: ${customer_name || 'Guest'}, Amount: ₹${total_amount}, Items: ${items.length}`);
    const result = await db.createOrder({ items, total_amount, customer_name, customer_email, customer_phone, customer_address, notes });
    log.info(`✓ Order #${result.orderId} created successfully with ${items.length} items`);
    res.json({ success: true, orderId: result.orderId, order: result.order });
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
    const order = await db.updateOrderStatus(id, status);
    log.info(`✓ Order #${id} status updated to ${status}`);
    res.json(order);
  } catch (error) {
    log.error('Error updating order', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Notifications Routes
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.getAllNotifications();
    res.json(notifications);
  } catch (error) {
    log.error('Error fetching notifications', error);
    res.json([]);
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notification = await db.createNotification(req.body);
    res.json(notification);
  } catch (error) {
    log.error('Error creating notification', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.markNotificationRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteNotification(id);
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
db.initializeTables().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    log.info('═══════════════════════════════════════════════════');
    log.info(`✓ PROJECT MARKETPLACE RUNNING`);
    log.info(`🌐 Server: http://0.0.0.0:${PORT}`);
    log.info(`📊 Database: PostgreSQL Connected`);
    log.info(`🛡️  Admin Login: Admin / Admin123`);
    log.info('═══════════════════════════════════════════════════');
  });
}).catch(err => {
  log.error('Failed to initialize database', err);
  process.exit(1);
});
