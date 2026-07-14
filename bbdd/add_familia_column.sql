-- Script para añadir la columna 'familia' a la tabla fallers existente
-- Ejecutar este script en phpMyAdmin o línea de comandos MySQL

USE pare_castells;

CREATE TABLE IF NOT EXISTS familias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apellidos VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE fallers
ADD COLUMN IF NOT EXISTS familia_id INT NULL;

ALTER TABLE pagaments
ADD COLUMN IF NOT EXISTS id_familia INT NULL;

ALTER TABLE pagaments
MODIFY COLUMN id_faller INT NULL;

ALTER TABLE pagaments
ADD CONSTRAINT IF NOT EXISTS fk_pag_familia
  FOREIGN KEY (id_familia) REFERENCES familias(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Verificar que las columnas se han añadido
DESCRIBE fallers;
DESCRIBE pagaments;
