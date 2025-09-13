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
// Obtener resumen de un turno
// ==============================
router.get('/resumen/:id', (req, res) => {
  const id = req.params.id;
  const turno = db.prepare("SELECT * FROM turnos WHERE id = ?").get(id);
  if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

  const resumen = db.prepare(`
    SELECT paquete, COUNT(*) AS cantidad, SUM(precio) AS total
    FROM servicios
    WHERE turno_id = ?
    GROUP BY paquete
    HAVING cantidad > 0
    ORDER BY total DESC
  `).all(id);

  const total = resumen.reduce((sum, r) => sum + r.total, 0);
  const cantidad = resumen.reduce((sum, r) => sum + r.cantidad, 0);

  res.json({ turno, resumen, total, cantidad });
});

// ==============================
// Verificar si hay turno activo
// ==============================
router.get('/activo', (req, res) => {
  try {
    const turno = db.prepare("SELECT * FROM turnos WHERE fin IS NULL ORDER BY inicio DESC LIMIT 1").get();
    res.json(turno ? { activo: true, turno } : { activo: false });
  } catch (error) {
    console.error("Error buscando turno activo:", error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ==============================
// Obtener resumen de turnos por rango
// ==============================
router.get('/resumen-por-rango', (req, res) => {
  const { inicio, fin } = req.query;
  try {
    const stmt = db.prepare(`
      SELECT t.id, t.operador, t.inicio, t.fin
      FROM turnos t
      WHERE DATE(t.inicio) BETWEEN ? AND ?
      ORDER BY t.inicio ASC
    `);
    const turnos = stmt.all(inicio, fin);
    res.json(turnos);
  } catch (error) {
    console.error("Error al obtener turnos por rango:", error);
    res.status(500).json({ error: "No se pudo obtener el resumen de turnos." });
  }
});

// ⬇️ ¡IMPORTANTE! Exportar al final
module.exports = router;
