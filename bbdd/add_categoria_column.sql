-- Script para añadir la columna 'categoria' a la tabla fallers existente
-- Ejecutar este script en phpMyAdmin o línea de comandos MySQL

USE pare_castells;

-- Añadir la columna categoria si no existe
ALTER TABLE fallers 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(20) NOT NULL DEFAULT 'Home';

-- Verificar que la columna se ha añadido
DESCRIBE fallers;
