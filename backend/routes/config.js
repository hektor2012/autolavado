const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const db = new Database("./db/database.db");

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    direccion TEXT,
    leyenda1 TEXT,
    leyenda TEXT,
    leyendaTicket TEXT,
    whatsappOrigen TEXT,
    logoBase64 TEXT
  )
`).run();

// Obtener configuración
router.get("/", (req, res) => {
  const config = db.prepare("SELECT * FROM configuracion WHERE id = 1").get();
  res.json(config || {});
});

// Guardar configuración
router.post("/", (req, res) => {
  const data = req.body;
  const existe = db.prepare("SELECT COUNT(*) AS total FROM configuracion WHERE id = 1").get().total;

  if (existe) {
    db.prepare(`
      UPDATE configuracion SET
        nombre = ?,
        direccion = ?,
        leyenda1 = ?,
        leyenda = ?,
        leyendaTicket = ?,
        whatsappOrigen = ?,
        logoBase64 = ?
      WHERE id = 1
    `).run(
      data.nombre,
      data.direccion,
      data.leyenda1,
      data.leyenda,
      data.leyendaTicket,
      data.whatsappOrigen,
      data.logoBase64
    );
  } else {
    db.prepare(`
      INSERT INTO configuracion (
        id, nombre, direccion, leyenda1, leyenda, leyendaTicket, whatsappOrigen, logoBase64
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      data.nombre,
      data.direccion,
      data.leyenda1,
      data.leyenda,
      data.leyendaTicket,
      data.whatsappOrigen,
      data.logoBase64
    );
  }

  res.json({ success: true });
});

module.exports = router;
