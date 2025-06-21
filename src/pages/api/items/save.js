// pages/api/items/save.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'aggroup.rs',
  port: 3306,
  user: 'aggroup_restpopis_aplikacija',
  password: '=}r)Hw$o5@J]zBFX',
  database: 'aggroup_popis_restoran',
  ssl: false,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
  charset: 'utf8mb4'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    const { name, category, unit } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name i category su obavezni' });
    }

    connection = await mysql.createConnection(dbConfig);
    
    const query = `
      INSERT INTO items (name, category, unit) 
      VALUES (?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      name.trim(), 
      category.trim(), 
      unit || 'kom'
    ]);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Artikal je dodat'
    });
  } catch (error) {
    console.error('Save item error:', error);
    res.status(500).json({ 
      error: 'Greška pri čuvanju artikla',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}