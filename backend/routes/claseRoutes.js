const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET todas las clases
router.get('/', (req, res) => {
    const sql = `
        SELECT c.*, 
            CONCAT(u.nombre, ' ', u.apellido) AS entrenador_nombre,
            e.id AS entrenador_id
        FROM clases_grupales c
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        LEFT JOIN usuarios u ON e.id_usuario = u.id
        WHERE c.activa = 1
        ORDER BY c.dia_semana, c.hora_inicio`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener clases' });
        res.json(results);
    });
});

// GET clases por entrenador
router.get('/entrenador/:id', (req, res) => {
    const sql = `
        SELECT c.*,
            CONCAT(u.nombre, ' ', u.apellido) AS entrenador_nombre
        FROM clases_grupales c
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        LEFT JOIN usuarios u ON e.id_usuario = u.id
        WHERE c.id_entrenador = ? AND c.activa = 1
        ORDER BY c.dia_semana, c.hora_inicio`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        res.json(results);
    });
});

// GET clases inscritas por usuario
router.get('/usuario/:id', (req, res) => {
    const sql = `
        SELECT 
            ic.id AS inscripcion_id,
            ic.estado,
            ic.fecha_inscripcion,
            c.id AS clase_id,
            c.nombre,
            c.descripcion,
            c.dia_semana,
            c.hora_inicio,
            c.hora_fin,
            c.capacidad_maxima,
            CONCAT(u.nombre, ' ', u.apellido) AS entrenador_nombre
        FROM inscripciones_clases ic
        JOIN clases_grupales c ON ic.id_clase = c.id
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        LEFT JOIN usuarios u ON e.id_usuario = u.id
        WHERE ic.id_usuario = ? AND ic.estado = 'inscrito'
        ORDER BY c.dia_semana, c.hora_inicio`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// GET alumnos inscritos por entrenador
router.get('/alumnos/:id_entrenador', (req, res) => {
    const sql = `
        SELECT 
            ic.id AS inscripcion_id,
            ic.fecha_inscripcion,
            ic.estado,
            u.id AS id_usuario,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            c.nombre AS clase_nombre,
            c.dia_semana,
            c.hora_inicio
        FROM inscripciones_clases ic
        JOIN usuarios u ON ic.id_usuario = u.id
        JOIN clases_grupales c ON ic.id_clase = c.id
        WHERE c.id_entrenador = ? AND ic.estado = 'inscrito'
        ORDER BY c.nombre, u.nombre`;
    db.query(sql, [req.params.id_entrenador], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error', error: err.message });
        res.json(results);
    });
});

// GET una clase por id
router.get('/:id', (req, res) => {
    db.query('SELECT * FROM clases_grupales WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        if (!results.length) return res.status(404).json({ mensaje: 'Clase no encontrada' });
        res.json(results[0]);
    });
});

// POST crear clase
router.post('/', (req, res) => {
    const { nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima, id_entrenador } = req.body;
    if (!nombre || !dia_semana || !hora_inicio || !hora_fin) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        `INSERT INTO clases_grupales (nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima, id_entrenador)
         VALUES (?,?,?,?,?,?,?)`,
        [nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima || 20, id_entrenador || null],
        (err, result) => {
            if (err) return res.status(500).json({ mensaje: 'Error al crear clase' });
            res.status(201).json({ mensaje: '✅ Clase creada exitosamente', id: result.insertId });
        }
    );
});

// PUT editar clase
router.put('/:id', (req, res) => {
    const { nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima, id_entrenador } = req.body;
    if (!nombre || !dia_semana || !hora_inicio || !hora_fin) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }
    db.query(
        `UPDATE clases_grupales SET nombre=?, descripcion=?, dia_semana=?, hora_inicio=?, hora_fin=?, capacidad_maxima=?, id_entrenador=? WHERE id=?`,
        [nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima, id_entrenador || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar clase' });
            res.json({ mensaje: '✅ Clase actualizada exitosamente' });
        }
    );
});

// PUT asignar entrenador a clase
router.put('/:id/asignar', (req, res) => {
    const { id_entrenador } = req.body;
    db.query(
        'UPDATE clases_grupales SET id_entrenador = ? WHERE id = ?',
        [id_entrenador, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al asignar entrenador' });
            res.json({ mensaje: '✅ Entrenador asignado exitosamente' });
        }
    );
});

// DELETE desactivar clase
router.delete('/:id', (req, res) => {
    db.query('UPDATE clases_grupales SET activa = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al eliminar clase' });
        res.json({ mensaje: '✅ Clase eliminada exitosamente' });
    });
});

// POST inscribir cliente a clase
router.post('/inscribir', (req, res) => {
    const { id_usuario, id_clase } = req.body;
    if (!id_usuario || !id_clase) return res.status(400).json({ mensaje: 'Faltan datos' });
    db.query(
        'SELECT * FROM inscripciones_clases WHERE id_usuario=? AND id_clase=? AND estado="inscrito"',
        [id_usuario, id_clase],
        (err, results) => {
            if (err) return res.status(500).json({ mensaje: 'Error' });
            if (results.length > 0) return res.status(400).json({ mensaje: 'Ya estás inscrito en esta clase' });
            db.query(
                'INSERT INTO inscripciones_clases (id_usuario, id_clase, estado) VALUES (?,?,"inscrito")',
                [id_usuario, id_clase],
                (err, result) => {
                    if (err) return res.status(500).json({ mensaje: 'Error al inscribirse' });
                    res.json({ mensaje: '✅ Inscripción exitosa', id: result.insertId });
                }
            );
        }
    );
});

// PUT cancelar inscripción
router.put('/cancelar/:id_inscripcion', (req, res) => {
    db.query(
        'UPDATE inscripciones_clases SET estado = "cancelado" WHERE id = ?',
        [req.params.id_inscripcion],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al cancelar inscripción' });
            res.json({ mensaje: '✅ Inscripción cancelada' });
        }
    );
});

module.exports = router;