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

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Project Marketplace running at http://0.0.0.0:${PORT}`);
    console.log('📊 Ready for PostgreSQL database connection');
  });
});
