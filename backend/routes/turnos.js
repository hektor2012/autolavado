// backend/routes/turnos.js
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ==============================
// Iniciar turno
// ==============================
router.post('/iniciar', (req, res) => {
  const { operador, clave } = req.body;
  const inicio = new Date().toISOString();

  const stmt = db.prepare("INSERT INTO turnos (operador, clave, inicio) VALUES (?, ?, ?)");
  const result = stmt.run(operador, clave, inicio);

  res.json({ success: true, turnoId: result.lastInsertRowid });
});

// ==============================
// Cerrar turno
// ==============================
router.post('/cerrar', (req, res) => {
  const { id } = req.body;
  const fin = new Date().toISOString();

  db.prepare("UPDATE turnos SET fin = ? WHERE id = ?").run(fin, id);
  res.json({ success: true });
});

// ==============================
// Obtener resumen de turno
// ==============================
router.get('/resumen/:id', (req, res) => {
  const id = req.params.id;
  const turno = db.prepare("SELECT * FROM turnos WHERE id = ?").get(id);
  const servicios = db.prepare("SELECT * FROM servicios WHERE turno_id = ?").all(id);
  const total = servicios.reduce((sum, s) => sum + s.precio, 0);

  res.json({
    turno,
    servicios,
    total,
    cantidad: servicios.length
  });
});

module.exports = router;
