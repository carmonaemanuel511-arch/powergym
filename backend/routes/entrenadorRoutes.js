const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todos los entrenadores
router.get('/', (req, res) => {
    const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono
        FROM entrenadores e
        JOIN usuarios u ON e.id_usuario = u.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener entrenadores' });
        res.json(results);
    });
});

// GET entrenador por id de usuario
router.get('/usuario/:id_usuario', (req, res) => {
    const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono
        FROM entrenadores e
        JOIN usuarios u ON e.id_usuario = u.id
        WHERE e.id_usuario = ?`;
    db.query(sql, [req.params.id_usuario], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        if (!results.length) return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
        res.json(results[0]);
    });
});

// PUT actualizar disponibilidad
router.put('/disponibilidad/:id', (req, res) => {
    const { disponible } = req.body;
    db.query(
        'UPDATE entrenadores SET disponible = ? WHERE id = ?',
        [disponible, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar disponibilidad' });
            res.json({ mensaje: '✅ Disponibilidad actualizada', disponible });
        }
    );
});

// PUT editar info entrenador
router.put('/:id', (req, res) => {
    const { especialidad, descripcion } = req.body;
    db.query(
        'UPDATE entrenadores SET especialidad=?, descripcion=? WHERE id=?',
        [especialidad, descripcion, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar entrenador' });
            res.json({ mensaje: '✅ Entrenador actualizado' });
        }
    );
});

module.exports = router;