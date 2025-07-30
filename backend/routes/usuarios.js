// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ==============================
// Login
// ==============================
router.post('/login', (req, res) => {
  const { nombre, clave } = req.body;
  const usuario = db.prepare("SELECT id, nombre, rol FROM usuarios WHERE nombre = ? AND clave = ?").get(nombre, clave);

  if (!usuario) {
    return res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
  }

  res.json({ success: true, usuario });
});

// ==============================
// Crear nuevo usuario (solo admin)
// ==============================
router.post('/crear', (req, res) => {
  const { nombre, clave, rol } = req.body;
  try {
    const result = db.prepare("INSERT INTO usuarios (nombre, clave, rol) VALUES (?, ?, ?)").run(nombre, clave, rol);
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==============================
// Cambiar contraseña
// ==============================
router.put('/cambiar-clave', (req, res) => {
  const { id, nuevaClave } = req.body;
  const result = db.prepare("UPDATE usuarios SET clave = ? WHERE id = ?").run(nuevaClave, id);
  res.json({ success: result.changes > 0 });
});
// ==============================
// Obtener todos los usuarios (para admin)
// ==============================
router.get('/', (req, res) => {
  const usuarios = db.prepare("SELECT id, nombre, rol FROM usuarios").all();
  res.json(usuarios);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  try {
    const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);

    if (!usuario) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    if (usuario.nombre.toLowerCase() === "admin") {
      return res.status(403).json({ success: false, error: "No se puede eliminar el usuario administrador principal" });
    }

    db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ success: false, error: "Error al eliminar usuario" });
  }
});

module.exports = router;