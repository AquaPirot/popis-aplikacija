// src/pages/api/inventory/list.js
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Učitaj sve popise, sortiraj po datumu (najnoviji prvi)
    const query = `
      SELECT 
        id, 
        datum, 
        sastavio, 
        total_items, 
        items_with_quantity, 
        timestamp
      FROM inventory 
      ORDER BY timestamp DESC
    `;
    
    const [inventories] = await connection.execute(query);
    
    res.status(200).json({
      success: true,
      data: inventories,
      count: inventories.length
    });
  } catch (error) {
    console.error('List inventory error:', error);
    res.status(500).json({ 
      error: 'Greška pri učitavanju istorije popisa',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}