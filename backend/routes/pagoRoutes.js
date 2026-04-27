const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todos los pagos
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            p.id,
            p.referencia,
            p.monto,
            p.metodo_pago,
            p.estado,
            p.fecha_pago,
            u.nombre,
            u.apellido,
            u.email,
            pl.nombre AS plan_nombre
        FROM pagos p
        JOIN usuarios u ON p.id_usuario = u.id
        JOIN membresias m ON p.id_membresia = m.id
        JOIN planes pl ON m.id_plan = pl.id
        ORDER BY p.fecha_pago DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// GET pagos por usuario
router.get('/usuario/:id', (req, res) => {
    const sql = `
        SELECT 
            p.id,
            p.referencia,
            p.monto,
            p.metodo_pago,
            p.estado,
            p.fecha_pago,
            pl.nombre AS plan_nombre,
            m.fecha_inicio,
            m.fecha_vencimiento
        FROM pagos p
        JOIN membresias m ON p.id_membresia = m.id
        JOIN planes pl ON m.id_plan = pl.id
        WHERE p.id_usuario = ?
        ORDER BY p.fecha_pago DESC`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// GET estadísticas
router.get('/estadisticas', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) AS total_pagos,
            SUM(CASE WHEN estado='completado' THEN monto ELSE 0 END) AS ingresos_totales,
            SUM(CASE WHEN MONTH(fecha_pago)=MONTH(NOW()) AND estado='completado' THEN monto ELSE 0 END) AS ingresos_mes
        FROM pagos`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results[0]);
    });
});

// POST realizar pago
router.post('/', (req, res) => {
    const { id_usuario, id_plan, metodo_pago } = req.body;

    if (!id_usuario || !id_plan || !metodo_pago) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    db.query('SELECT * FROM planes WHERE id = ?', [id_plan], (err, planes) => {
        if (err || !planes.length) return res.status(404).json({ mensaje: 'Plan no encontrado' });

        const plan = planes[0];
        const fechaInicio = new Date();
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + plan.duracion_dias);

        db.query(
            `INSERT INTO membresias (id_usuario, id_plan, fecha_inicio, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, 'activa')`,
            [id_usuario, id_plan, fechaInicio, fechaVencimiento],
            (err, result) => {
                if (err) return res.status(500).json({ mensaje: 'Error al crear membresía' });

                const referencia = 'PG-' + Date.now();
                db.query(
                    `INSERT INTO pagos (id_usuario, id_membresia, monto, metodo_pago, estado, referencia) VALUES (?, ?, ?, ?, 'completado', ?)`,
                    [id_usuario, result.insertId, plan.precio, metodo_pago, referencia],
                    (err) => {
                        if (err) return res.status(500).json({ mensaje: 'Error al registrar pago' });
                        res.json({
                            mensaje: '✅ Pago realizado exitosamente',
                            referencia,
                            plan: plan.nombre,
                            monto: plan.precio,
                            fecha_vencimiento: fechaVencimiento
                        });
                    }
                );
            }
        );
    });
});

module.exports = router;