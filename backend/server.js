const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express(); // ✅ ¡Primero se inicializa app!

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
const paquetesRoutes = require('./routes/paquetes');
app.use('/api/paquetes', paquetesRoutes);

const serviciosRoutes = require('./routes/servicios');
app.use('/api/servicios', serviciosRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const turnosRoutes = require('./routes/turnos');
app.use('/api/turnos', turnosRoutes);

const configRoutes = require("./routes/config");
app.use("/api/config", configRoutes);




// Iniciar servidor
const port = 3001;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
