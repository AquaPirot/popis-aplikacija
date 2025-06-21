// src/pages/api/inventory/[id].js
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
  const { id } = req.query;

  if (req.method === 'GET') {
    // Učitaj detalje popisa sa stavkama
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      
      // Učitaj osnovne podatke o popisu
      const [inventoryRows] = await connection.execute(
        'SELECT * FROM inventory WHERE id = ?',
        [id]
      );
      
      if (inventoryRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Popis nije pronađen' 
        });
      }
      
      const inventory = inventoryRows[0];
      
      // Učitaj stavke popisa
      const [itemRows] = await connection.execute(
        'SELECT * FROM inventory_items WHERE inventory_id = ? ORDER BY category, item_name',
        [id]
      );
      
      res.status(200).json({
        success: true,
        data: {
          ...inventory,
          items: itemRows
        }
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ 
        error: 'Greška pri učitavanju popisa',
        details: error.message 
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  } 
  else if (req.method === 'DELETE') {
    // Obriši popis
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      
      // Brisanje je cascade, tako da će se stavke automatski obrisati
      const [result] = await connection.execute(
        'DELETE FROM inventory WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Popis nije pronađen' 
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Popis je uspešno obrisan'
      });
    } catch (error) {
      console.error('Delete inventory error:', error);
      res.status(500).json({ 
        error: 'Greška pri brisanju popisa',
        details: error.message 
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}