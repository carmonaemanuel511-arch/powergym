const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ mensaje: '❌ Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ mensaje: '❌ Token inválido o expirado' });
    }
};

const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: '❌ Acceso solo para administradores' });
    }
    next();
};

const soloEntrenador = (req, res, next) => {
    if (req.usuario.rol !== 'entrenador') {
        return res.status(403).json({ mensaje: '❌ Acceso solo para entrenadores' });
    }
    next();
};

module.exports = { verificarToken, soloAdmin, soloEntrenador };