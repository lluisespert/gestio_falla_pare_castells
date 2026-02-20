-- Script para añadir la columna 'familia' a la tabla fallers existente
-- Ejecutar este script en phpMyAdmin o línea de comandos MySQL

USE pare_castells;

-- Añadir la columna familia si no existe
ALTER TABLE fallers
ADD COLUMN IF NOT EXISTS familia VARCHAR(100);

-- Verificar que la columna se ha añadido
DESCRIBE fallers;
