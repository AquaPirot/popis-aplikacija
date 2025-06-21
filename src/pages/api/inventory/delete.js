// pages/api/inventory/delete.js
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
    
    // Prvo proveri da li popis postoji
    const [checkResult] = await connection.execute(
      'SELECT id, datum, sastavio FROM inventory WHERE id = ?', 
      [id]
    );
    
    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Popis nije pronađen' });
    }

    const inventory = checkResult[0];

    // Početak transakcije za sigurno brisanje
    await connection.beginTransaction();

    try {
      // Obriši stavke popisa (inventory_items se brišu prvo zbog foreign key)
      await connection.execute(
        'DELETE FROM inventory_items WHERE inventory_id = ?', 
        [id]
      );

      // Obriši glavni popis
      const [deleteResult] = await connection.execute(
        'DELETE FROM inventory WHERE id = ?', 
        [id]
      );

      if (deleteResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Popis nije pronađen' });
      }

      await connection.commit();
      
      res.status(200).json({
        success: true,
        message: `Popis od ${inventory.datum} (${inventory.sastavio}) je obrisan`,
        deletedId: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
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