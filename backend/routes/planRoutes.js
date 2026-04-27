const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todos los planes
router.get('/', (req, res) => {
    db.query('SELECT * FROM planes WHERE activo = 1', (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener planes' });
        res.json(results);
    });
});

// GET un plan por id
router.get('/:id', (req, res) => {
    db.query('SELECT * FROM planes WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        if (!results.length) return res.status(404).json({ mensaje: 'Plan no encontrado' });
        res.json(results[0]);
    });
});

// POST crear plan
router.post('/', (req, res) => {
    const { nombre, precio, duracion_dias, descripcion, beneficios } = req.body;
    if (!nombre || !precio || !duracion_dias) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        'INSERT INTO planes (nombre, precio, duracion_dias, descripcion, beneficios) VALUES (?,?,?,?,?)',
        [nombre, precio, duracion_dias, descripcion, beneficios],
        (err, result) => {
            if (err) return res.status(500).json({ mensaje: 'Error al crear plan' });
            res.status(201).json({ mensaje: '✅ Plan creado exitosamente', id: result.insertId });
        }
    );
});

// PUT editar plan
router.put('/:id', (req, res) => {
    const { nombre, precio, duracion_dias, descripcion, beneficios } = req.body;
    if (!nombre || !precio || !duracion_dias) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        'UPDATE planes SET nombre=?, precio=?, duracion_dias=?, descripcion=?, beneficios=? WHERE id=?',
        [nombre, precio, duracion_dias, descripcion, beneficios, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar plan' });
            res.json({ mensaje: '✅ Plan actualizado exitosamente' });
        }
    );
});

// DELETE desactivar plan
router.delete('/:id', (req, res) => {
    db.query('UPDATE planes SET activo = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al eliminar plan' });
        res.json({ mensaje: '✅ Plan eliminado exitosamente' });
    });
});

module.exports = router;