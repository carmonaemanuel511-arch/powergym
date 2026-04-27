const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todos los clientes con su plan activo
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.fecha_registro,
            pl.nombre AS plan_activo,
            m.fecha_vencimiento,
            m.estado AS estado_membresia
        FROM usuarios u
        LEFT JOIN membresias m ON u.id = m.id_usuario 
            AND m.estado = 'activa'
            AND m.fecha_vencimiento >= CURDATE()
        LEFT JOIN planes pl ON m.id_plan = pl.id
        WHERE u.id_rol = 2 AND u.activo = 1
        ORDER BY u.fecha_registro DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener clientes', error: err.message });
        res.json(results);
    });
});

// GET un cliente por id
router.get('/:id', (req, res) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.fecha_registro,
            pl.nombre AS plan_activo,
            m.fecha_inicio,
            m.fecha_vencimiento,
            m.estado AS estado_membresia
        FROM usuarios u
        LEFT JOIN membresias m ON u.id = m.id_usuario 
            AND m.estado = 'activa'
        LEFT JOIN planes pl ON m.id_plan = pl.id
        WHERE u.id = ?`;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        if (!results.length) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        res.json(results[0]);
    });
});

module.exports = router;