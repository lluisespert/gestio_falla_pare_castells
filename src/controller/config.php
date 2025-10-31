<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'pare_castells');
define('DB_USER', 'root');  // Usuario por defecto de XAMPP
define('DB_PASS', '');      // Sin contraseña por defecto en XAMPP

$conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conexion->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Conexión fallida: " . $conexion->connect_error
    ]);
    exit;
}
?>