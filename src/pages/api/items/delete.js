// pages/api/items/delete.js
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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID je obavezan' });
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Prvo proveri da li artikal postoji
    const [checkResult] = await connection.execute(
      'SELECT id, name FROM items WHERE id = ?', 
      [id]
    );
    
    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Artikal nije pronađen' });
    }

    // Obriši artikal
    const [deleteResult] = await connection.execute(
      'DELETE FROM items WHERE id = ?', 
      [id]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Artikal nije pronađen' });
    }
    
    res.status(200).json({
      success: true,
      message: `Artikal "${checkResult[0].name}" je obrisan`,
      deletedId: id
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      error: 'Greška pri brisanju artikla',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}