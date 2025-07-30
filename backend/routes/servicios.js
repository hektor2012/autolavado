// backend/routes/servicios.js
const express = require('express');
const router = express.Router();
const db = require('../db/database'); // ✅ Única conexión compartida

// ==============================
// Obtener servicios por fecha
// ==============================
router.get('/', (req, res) => {
  let { inicio, fin } = req.query;

  const hoy = new Date().toISOString().split('T')[0];
  inicio = inicio || hoy;
  fin = fin || hoy;

  const inicioCompleto = `${inicio}T00:00:00`;
  const finCompleto = `${fin}T23:59:59`;

  const stmt = db.prepare(`
    SELECT * FROM servicios
    WHERE datetime(fecha) BETWEEN datetime(?) AND datetime(?)
    ORDER BY fecha DESC
  `);

  const servicios = stmt.all(inicioCompleto, finCompleto).map(s => {
    const fechaLocal = new Date(s.fecha);
    return {
      ...s,
      fecha: fechaLocal.toLocaleDateString('es-MX'),
      hora: fechaLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  });

  res.json(servicios);
});

// ==============================
// Registrar nuevo servicio
// ==============================
router.post('/registrar', (req, res) => {
  try {
    const { paquete, precio, marca, modelo, whatsapp, notificar, folio } = req.body;

    const turno_id = 0; // ← Fijamos temporalmente

    const stmt = db.prepare(`
      INSERT INTO servicios (paquete, precio, marca, modelo, whatsapp, notificar, folio, fecha, turno_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
    `);

    const result = stmt.run(
      paquete,
      precio,
      marca,
      modelo,
      whatsapp,
      notificar ? 1 : 0,
      folio,
      turno_id
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("❌ Error al registrar servicio:", error.message);
    res.status(500).json({ error: "Error al registrar servicio" });
  }
});




// ==============================
// Borrar todos los servicios
// ==============================
router.delete('/borrar-todos', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM servicios');
    const result = stmt.run();
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get('/pendientes-notificar', (req, res) => {
  try {
    const servicios = db.prepare(`
      SELECT folio, marca, modelo, whatsapp
      FROM servicios
      WHERE notificar = 1 AND notificado = 0
      ORDER BY id DESC
    `).all();

    res.json(servicios);
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error.message);
    res.status(500).json({ error: "Error interno" });
  }
});
router.post('/marcar-notificado', (req, res) => {
  const { folio } = req.body;

  try {
    const stmt = db.prepare(`UPDATE servicios SET notificado = 1 WHERE folio = ?`);
    const result = stmt.run(folio);

    res.json({ success: true, cambios: result.changes });
  } catch (error) {
    console.error("❌ Error al marcar notificado:", error.message);
    res.status(500).json({ error: "Error al actualizar" });
  }
});



module.exports = router;
