// backend/routes/paquetes.js
const express = require('express');
const router = express.Router();
const db = require('../db/database'); // ✅ Única conexión compartida

// ==============================
// Rutas para paquetes
// ==============================

// Obtener todos los paquetes
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM paquetes").all();
  res.json(rows);
});

// Agregar paquete
router.post('/', (req, res) => {
  const { nombre, precio } = req.body;
  const stmt = db.prepare("INSERT INTO paquetes (nombre, precio) VALUES (?, ?)");
  const info = stmt.run(nombre, precio);
  res.status(201).json({ id: info.lastInsertRowid, nombre, precio });
});

// Eliminar paquete
router.delete('/:id', (req, res) => {
  const stmt = db.prepare("DELETE FROM paquetes WHERE id = ?");
  stmt.run(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
