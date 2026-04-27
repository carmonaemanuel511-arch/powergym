const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// REGISTRO
const registro = (req, res) => {
    const { nombre, apellido, email, contrasena, telefono, fecha_nacimiento, id_rol } = req.body;

    // Si no viene id_rol, por defecto es cliente (2)
    const rol = id_rol || 2;

    db.query('SELECT id FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
        if (results.length > 0) return res.status(400).json({ mensaje: 'El email ya está registrado' });

        const hash = bcrypt.hashSync(contrasena, 10);

        const sql = `INSERT INTO usuarios 
            (nombre, apellido, email, contrasena, telefono, fecha_nacimiento, id_rol) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [nombre, apellido, email, hash, telefono, fecha_nacimiento, rol], (err, result) => {
            if (err) return res.status(500).json({ mensaje: 'Error al registrar usuario' });

            // Si es entrenador (id_rol = 3), crear también su perfil en entrenadores
            if (rol == 3) {
                const { especialidad, descripcion } = req.body;
                const sqlEnt = `INSERT INTO entrenadores (id_usuario, especialidad, disponible, descripcion) 
                                VALUES (?, ?, 1, ?)`;
                db.query(sqlEnt, [result.insertId, especialidad || '', descripcion || ''], (err2) => {
                    if (err2) console.error('Error creando perfil entrenador:', err2);
                });
            }

            res.status(201).json({ mensaje: '✅ Usuario registrado exitosamente' });
        });
    });
};

// LOGIN
const login = (req, res) => {
    const { email, contrasena } = req.body;

    const sql = `
        SELECT u.*, r.nombre AS rol 
        FROM usuarios u 
        JOIN roles r ON u.id_rol = r.id 
        WHERE u.email = ? AND u.activo = 1`;

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
        if (results.length === 0) return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });

        const usuario = results[0];

        const esValida = bcrypt.compareSync(contrasena, usuario.contrasena);
        if (!esValida) return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: '✅ Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    });
};

module.exports = { login, registro };