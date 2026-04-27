-- ============================================
--   POWERGYM - Base de Datos Completa
--   Medellín, Colombia
-- ============================================

CREATE DATABASE IF NOT EXISTS powergym;
USE powergym;

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL -- admin, cliente, entrenador
);

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    id_rol INT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_rol) REFERENCES roles(id)
);

-- ============================================
-- TABLA: entrenadores
-- ============================================
CREATE TABLE entrenadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    especialidad VARCHAR(100),
    disponible TINYINT(1) DEFAULT 1, -- 1=disponible, 0=no disponible
    descripcion TEXT,
    foto VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: planes
-- ============================================
CREATE TABLE planes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    duracion_dias INT NOT NULL, -- 30, 90, 180, 365
    descripcion TEXT,
    beneficios TEXT,
    activo TINYINT(1) DEFAULT 1
);

-- ============================================
-- TABLA: membresias (cliente se inscribe a un plan)
-- ============================================
CREATE TABLE membresias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_plan INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado ENUM('activa','vencida','cancelada') DEFAULT 'activa',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_plan) REFERENCES planes(id)
);

-- ============================================
-- TABLA: pagos
-- ============================================
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_membresia INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('PSE','transferencia') NOT NULL,
    estado ENUM('pendiente','completado','fallido') DEFAULT 'pendiente',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(100) UNIQUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_membresia) REFERENCES membresias(id)
);

-- ============================================
-- TABLA: clases_grupales
-- ============================================
CREATE TABLE clases_grupales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Cycling, Box, Aerobicos
    descripcion TEXT,
    id_entrenador INT,
    dia_semana VARCHAR(20), -- Lunes, Martes...
    hora_inicio TIME,
    hora_fin TIME,
    capacidad_maxima INT DEFAULT 20,
    activa TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id)
);

-- ============================================
-- TABLA: inscripciones_clases
-- ============================================
CREATE TABLE inscripciones_clases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_clase INT NOT NULL,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('inscrito','cancelado') DEFAULT 'inscrito',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_clase) REFERENCES clases_grupales(id)
);

-- ============================================
-- TABLA: rutinas
-- ============================================
CREATE TABLE rutinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nivel ENUM('principiante','intermedio','avanzado') NOT NULL,
    tipo ENUM('fuerza','hipertrofia','cardio','perdida_de_grasa') NOT NULL,
    descripcion TEXT,
    duracion_semanas INT,
    id_entrenador INT,
    activa TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id)
);

-- ============================================
-- TABLA: suplementos
-- ============================================
CREATE TABLE suplementos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    imagen VARCHAR(255),
    activo TINYINT(1) DEFAULT 1
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Roles
INSERT INTO roles (nombre) VALUES ('admin'), ('cliente'), ('entrenador');

-- Usuario administrador por defecto
-- Contraseña: admin123 (encriptada con bcrypt)
INSERT INTO usuarios (nombre, apellido, email, contrasena, telefono, id_rol)
VALUES (
    'Admin',
    'PowerGym',
    'admin@powergym.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh/S',
    '+57 300 000 0000',
    1
);

-- Planes de membresía
INSERT INTO planes (nombre, precio, duracion_dias, descripcion, beneficios) VALUES
(
    'Plan Básico',
    79900,
    30,
    'Acceso al gimnasio por 1 mes',
    'Acceso a zona de musculación y cardio, Casillero incluido, Evaluación física inicial'
),
(
    'Plan Estándar',
    199900,
    90,
    'Acceso al gimnasio por 3 meses',
    'Todo lo del Plan Básico, 2 clases grupales por semana, Descuento del 10% en suplementos'
),
(
    'Plan Premium',
    349900,
    180,
    'Acceso al gimnasio por 6 meses',
    'Todo lo del Plan Estándar, Clases grupales ilimitadas, 1 sesión mensual con entrenador personal, Descuento del 15% en suplementos'
),
(
    'Plan Anual',
    599900,
    365,
    'Acceso al gimnasio por 1 año completo',
    'Todo lo del Plan Premium, Entrenador personal cada 15 días, Rutina personalizada, Descuento del 20% en suplementos, Acceso prioritario a clases'
);

-- Clases grupales
INSERT INTO clases_grupales (nombre, descripcion, dia_semana, hora_inicio, hora_fin, capacidad_maxima) VALUES
('Cycling', 'Clase de ciclismo indoor de alta intensidad', 'Lunes', '06:00:00', '07:00:00', 15),
('Cycling', 'Clase de ciclismo indoor de alta intensidad', 'Miércoles', '06:00:00', '07:00:00', 15),
('Cycling', 'Clase de ciclismo indoor de alta intensidad', 'Viernes', '06:00:00', '07:00:00', 15),
('Box', 'Clase de boxeo y acondicionamiento físico', 'Martes', '07:00:00', '08:00:00', 12),
('Box', 'Clase de boxeo y acondicionamiento físico', 'Jueves', '07:00:00', '08:00:00', 12),
('Box', 'Clase de boxeo y acondicionamiento físico', 'Sábado', '08:00:00', '09:00:00', 12),
('Aeróbicos', 'Clase de aeróbicos para todos los niveles', 'Lunes', '08:00:00', '09:00:00', 20),
('Aeróbicos', 'Clase de aeróbicos para todos los niveles', 'Miércoles', '08:00:00', '09:00:00', 20),
('Aeróbicos', 'Clase de aeróbicos para todos los niveles', 'Viernes', '08:00:00', '09:00:00', 20);

-- Suplementos
INSERT INTO suplementos (nombre, descripcion, precio, stock) VALUES
('Proteína Whey', 'Proteína de suero de leche, sabor chocolate y vainilla. 2kg', 189900, 30),
('Creatina', 'Creatina monohidratada pura. 500g', 89900, 25),
('Pre-Entreno', 'Suplemento pre-entrenamiento con cafeína y beta-alanina', 119900, 20),
('BCAA', 'Aminoácidos de cadena ramificada. Sabor frutas', 79900, 35),
('Multivitamínico', 'Complejo vitamínico y mineral para deportistas', 59900, 40);