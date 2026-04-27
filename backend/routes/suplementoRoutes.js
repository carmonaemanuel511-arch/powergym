const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todos los suplementos
router.get('/', (req, res) => {
    db.query('SELECT * FROM suplementos WHERE activo = 1', (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener suplementos' });
        res.json(results);
    });
});

// GET todos los pedidos de suplementos (admin)
router.get('/pedidos', (req, res) => {
    const sql = `
        SELECT 
            ps.id,
            ps.referencia,
            ps.cantidad,
            ps.precio_unitario,
            ps.total,
            ps.metodo_pago,
            ps.estado,
            ps.fecha_pedido,
            u.nombre,
            u.apellido,
            u.email,
            s.nombre AS suplemento_nombre
        FROM pedidos_suplementos ps
        JOIN usuarios u ON ps.id_usuario = u.id
        JOIN suplementos s ON ps.id_suplemento = s.id
        ORDER BY ps.fecha_pedido DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// GET pedidos por usuario
router.get('/pedidos/usuario/:id', (req, res) => {
    const sql = `
        SELECT 
            ps.id,
            ps.referencia,
            ps.cantidad,
            ps.precio_unitario,
            ps.total,
            ps.metodo_pago,
            ps.estado,
            ps.fecha_pedido,
            s.nombre AS suplemento_nombre
        FROM pedidos_suplementos ps
        JOIN suplementos s ON ps.id_suplemento = s.id
        WHERE ps.id_usuario = ?
        ORDER BY ps.fecha_pedido DESC`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// POST realizar pedido de suplemento
router.post('/pedidos', (req, res) => {
    const { id_usuario, id_suplemento, cantidad, metodo_pago } = req.body;

    if (!id_usuario || !id_suplemento || !cantidad || !metodo_pago) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    // Verificar stock
    db.query('SELECT * FROM suplementos WHERE id = ? AND activo = 1', [id_suplemento], (err, sups) => {
        if (err || !sups.length) return res.status(404).json({ mensaje: 'Suplemento no encontrado' });

        const sup = sups[0];
        if (sup.stock < cantidad) {
            return res.status(400).json({ mensaje: `Stock insuficiente. Solo hay ${sup.stock} unidades disponibles` });
        }

        const total = sup.precio * cantidad;
        const referencia = 'SUP-' + Date.now();

        // Insertar pedido
        db.query(
            `INSERT INTO pedidos_suplementos 
             (id_usuario, id_suplemento, cantidad, precio_unitario, total, metodo_pago, estado, referencia)
             VALUES (?,?,?,?,?,'${metodo_pago}','completado',?)`,
            [id_usuario, id_suplemento, cantidad, sup.precio, total, referencia],
            (err) => {
                if (err) return res.status(500).json({ mensaje: 'Error al registrar pedido' });

                // Descontar stock
                db.query(
                    'UPDATE suplementos SET stock = stock - ? WHERE id = ?',
                    [cantidad, id_suplemento],
                    (err) => {
                        if (err) console.error('Error al descontar stock:', err);
                    }
                );

                res.json({
                    mensaje: '✅ Pedido realizado exitosamente',
                    referencia,
                    total,
                    suplemento: sup.nombre,
                    cantidad
                });
            }
        );
    });
});

// POST crear suplemento
router.post('/', (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    if (!nombre || !precio || !stock) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        'INSERT INTO suplementos (nombre, descripcion, precio, stock) VALUES (?,?,?,?)',
        [nombre, descripcion, precio, stock],
        (err, result) => {
            if (err) return res.status(500).json({ mensaje: 'Error al crear suplemento' });
            res.status(201).json({ mensaje: '✅ Suplemento creado', id: result.insertId });
        }
    );
});

// PUT editar suplemento
router.put('/:id', (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    if (!nombre || !precio || !stock) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        'UPDATE suplementos SET nombre=?, descripcion=?, precio=?, stock=? WHERE id=?',
        [nombre, descripcion, precio, stock, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar' });
            res.json({ mensaje: '✅ Suplemento actualizado' });
        }
    );
});

// DELETE desactivar suplemento
router.delete('/:id', (req, res) => {
    db.query('UPDATE suplementos SET activo = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });
        res.json({ mensaje: '✅ Suplemento eliminado' });
    });
});

module.exports = router;