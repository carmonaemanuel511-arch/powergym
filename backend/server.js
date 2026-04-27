const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// Importar rutas
const authRoutes        = require('./routes/authRoutes');
const clienteRoutes     = require('./routes/clienteRoutes');
const planRoutes        = require('./routes/planRoutes');
const pagoRoutes        = require('./routes/pagoRoutes');
const claseRoutes       = require('./routes/claseRoutes');
const entrenadorRoutes  = require('./routes/entrenadorRoutes');
const suplementoRoutes  = require('./routes/suplementoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',         authRoutes);
app.use('/api/clientes',     clienteRoutes);
app.use('/api/planes',       planRoutes);
app.use('/api/pagos',        pagoRoutes);
app.use('/api/clases',       claseRoutes);
app.use('/api/entrenadores', entrenadorRoutes);
app.use('/api/suplementos',  suplementoRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        mensaje: '💪 API PowerGym funcionando correctamente',
        version: '1.0.0',
        rutas: [
            '/api/auth',
            '/api/clientes',
            '/api/planes',
            '/api/pagos',
            '/api/clases',
            '/api/entrenadores',
            '/api/suplementos'
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor PowerGym corriendo en http://localhost:${PORT}`);
});