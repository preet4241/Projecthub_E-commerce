
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projecthub'
});

// Log database connection
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

// Database Handler Class
class Database {
  // ========== TABLE CREATION ==========
  async initializeTables() {
    const client = await pool.connect();
    try {
      // Projects table
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          subject VARCHAR(100) NOT NULL,
          college VARCHAR(100),
          topic VARCHAR(255) NOT NULL,
          price INTEGER NOT NULL,
          file VARCHAR(255),
          downloads INTEGER DEFAULT 0,
          pages INTEGER,
          description TEXT,
          packageincludes TEXT,
          primary_photo TEXT,
          other_photos TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          name VARCHAR(200),
          email VARCHAR(100) UNIQUE,
          college VARCHAR(100),
          is_banned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Cart items table
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

      // Orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          total_amount INTEGER,
          status VARCHAR(50) DEFAULT 'pending',
          customer_name VARCHAR(100),
          customer_email VARCHAR(100),
          customer_phone VARCHAR(20),
          customer_address TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Order items table
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

      // Notifications table
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

      console.log('[DB] All tables initialized successfully');
      return true;
    } catch (error) {
      console.error('[DB] Error initializing tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========== PROJECTS ==========
  async getAllProjects() {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  }

  async getProjectById(id) {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
  }

  async createProject(projectData) {
    const { subject, college, topic, price, file, pages, description, packageincludes, primary_photo, other_photos } = projectData;
    const result = await pool.query(
      `INSERT INTO projects (subject, college, topic, price, file, downloads, pages, description, packageincludes, primary_photo, other_photos) 
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10) RETURNING *`,
      [subject, college || 'General', topic, price, file || topic.toLowerCase().replace(/\s+/g, '-') + '.zip', pages || null, description || null, packageincludes || null, primary_photo || null, other_photos || null]
    );
    return result.rows[0];
  }

  async deleteProject(id) {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return true;
  }

  async getDistinctSubjects() {
    const result = await pool.query('SELECT DISTINCT subject FROM projects ORDER BY subject');
    return result.rows.map(r => r.subject);
  }

  async getDistinctColleges() {
    const result = await pool.query('SELECT DISTINCT college FROM projects WHERE college IS NOT NULL ORDER BY college');
    return result.rows.map(r => r.college);
  }

  // ========== USERS ==========
  async getAllUsers() {
    const result = await pool.query('SELECT * FROM users WHERE is_banned = FALSE ORDER BY created_at DESC');
    return result.rows;
  }

  async createUser(userData) {
    const { first_name, last_name, email, college } = userData;
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, name, email, college) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [first_name, last_name, `${first_name} ${last_name}`, email, college]
    );
    return result.rows[0];
  }

  async getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // ========== CART ==========
  async getCartItems() {
    const result = await pool.query(`
      SELECT c.id, c.project_id, c.quantity, p.topic, p.price, p.subject, p.college
      FROM cart_items c
      JOIN projects p ON c.project_id = p.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  async addToCart(projectId, quantity = 1) {
    const result = await pool.query(
      'INSERT INTO cart_items (project_id, quantity) VALUES ($1, $2) RETURNING *',
      [projectId, quantity]
    );
    return result.rows[0];
  }

  async removeFromCart(id) {
    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    return true;
  }

  async clearCart() {
    await pool.query('DELETE FROM cart_items');
    return true;
  }

  // ========== ORDERS ==========
  async getAllOrders(status = null) {
    let query = 'SELECT * FROM orders';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getOrderById(id) {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) return null;

    const itemsResult = await pool.query(`
      SELECT oi.*, p.topic, p.subject, p.college 
      FROM order_items oi
      JOIN projects p ON oi.project_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
  }

  async createOrder(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { items, total_amount, customer_name, customer_email, customer_phone, customer_address, notes } = orderData;

      const orderResult = await client.query(
        `INSERT INTO orders (total_amount, status, customer_name, customer_email, customer_phone, customer_address, notes) 
         VALUES ($1, 'pending', $2, $3, $4, $5, $6) RETURNING *`,
        [total_amount, customer_name || 'Guest', customer_email || '', customer_phone || '', customer_address || '', notes || '']
      );
      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, project_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.project_id, item.quantity, item.price]
        );
      }

      await client.query(
        'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)',
        [`New Order #${orderId}`, `Order placed for ₹${total_amount}`, 'order']
      );

      await client.query('COMMIT');
      return { orderId, order: orderResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateOrderStatus(id, status) {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    const statusText = status === 'confirmed' ? 'confirmed' : status === 'cancelled' ? 'cancelled' : 'updated';
    await pool.query(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)',
      [`Order #${id} ${statusText}`, `Order status changed to ${status}`, 'order']
    );

    return result.rows[0];
  }

  async getOrderStats() {
    const pending = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
    const confirmed = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'confirmed'");
    const cancelled = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'cancelled'");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'confirmed'");
    
    return {
      pending: parseInt(pending.rows[0].count),
      confirmed: parseInt(confirmed.rows[0].count),
      cancelled: parseInt(cancelled.rows[0].count),
      totalRevenue: parseInt(totalRevenue.rows[0].total)
    };
  }

  // ========== NOTIFICATIONS ==========
  async getAllNotifications() {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    return result.rows;
  }

  async createNotification(notifData) {
    const { title, message, type } = notifData;
    const result = await pool.query(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3) RETURNING *',
      [title, message, type || 'info']
    );
    return result.rows[0];
  }

  async markNotificationRead(id) {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    return true;
  }

  async deleteNotification(id) {
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    return true;
  }
}

// Export singleton instance
module.exports = new Database();
