// backend/db/database.js
const Database = require('better-sqlite3');
const db = new Database('./db/database.db');

// ==============================
// TABLAS PRINCIPALES
// ==============================

// Tabla de paquetes
db.prepare(`
  CREATE TABLE IF NOT EXISTS paquetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL
  )
`).run();

// Tabla de servicios
db.prepare(`
  CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paquete TEXT,
    precio REAL,
    marca TEXT,
    modelo TEXT,
    whatsapp TEXT,
    notificar INTEGER,
    fecha DATETIME,
    turno_id INTEGER
  )
`).run();

// Tabla de turnos
db.prepare(`
  CREATE TABLE IF NOT EXISTS turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operador TEXT,
    clave TEXT,
    inicio DATETIME,
    fin DATETIME
  )
`).run();

// Tabla de usuarios (admin y cajeros)
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'cajero'))
  )
`).run();

// ==============================
// USUARIO ADMIN POR DEFECTO
// ==============================
const existeAdmin = db.prepare("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'").get();
if (existeAdmin.total === 0) {
  db.prepare("INSERT INTO usuarios (nombre, clave, rol) VALUES (?, ?, ?)").run('admin', 'admin123', 'admin');
  console.log("✅ Usuario administrador creado: admin / admin123");
}

module.exports = db;
