const express = require('express');
const router = express.Router();
const db = require('../db/database'); // ✅ Conexión compartida

// ==============================
// Rutas para paquetes
// ==============================

// Obtener todos los paquetes
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM paquetes").all();
  res.json(rows);
});

// Agregar nuevo paquete
router.post('/', (req, res) => {
  const { nombre, precio } = req.body;

  const stmt = db.prepare(`
    INSERT INTO paquetes (nombre, precio)
    VALUES (?, ?)
  `);
  const info = stmt.run(nombre, precio);

  res.status(201).json({ id: info.lastInsertRowid, nombre, precio });
});

// Eliminar paquete por ID
router.delete('/:id', (req, res) => {
  const stmt = db.prepare("DELETE FROM paquetes WHERE id = ?");
  stmt.run(req.params.id);
  res.sendStatus(204); // No Content
});

// Editar paquete existente (nombre, precio, color)
router.put('/:id', (req, res) => {
  const { nombre, precio, color_fondo, color_texto } = req.body;
  const id = req.params.id;

  try {
    const stmt = db.prepare(`
      UPDATE paquetes
      SET nombre = ?, precio = ?, color_fondo = ?, color_texto = ?
      WHERE id = ?
    `);
    stmt.run(nombre, precio, color_fondo, color_texto, id);
    res.json({ mensaje: 'Paquete actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar paquete:', error);
    res.status(500).json({ error: 'Error al actualizar paquete' });
  }
});

module.exports = router;
